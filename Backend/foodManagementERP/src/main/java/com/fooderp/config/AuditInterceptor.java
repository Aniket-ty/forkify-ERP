package com.fooderp.config;

import com.fooderp.entity.AuditLog;
import com.fooderp.entity.Branch;
import com.fooderp.entity.User;
import com.fooderp.repository.AuditLogRepository;
import com.fooderp.repository.BranchRepository;
import com.fooderp.repository.UserRepository;
import com.fooderp.security.UserDetailsImpl;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.time.LocalDateTime;
import java.util.Set;

/**
 * AuditInterceptor
 *
 * Automatically logs all mutating HTTP requests (POST, PUT, DELETE, PATCH)
 * to the audit_logs table. This runs AFTER the handler so we also capture
 * the HTTP response status code.
 *
 * Manual calls to AuditService.log() in controllers/services take precedence
 * for domain-specific detail (e.g. "Wastage approved — ingredient X deducted").
 * This interceptor is the safety net that catches everything else.
 *
 * Registered in WebConfig.java.
 */
@Component
public class AuditInterceptor implements HandlerInterceptor {

    private static final Logger logger = LoggerFactory.getLogger(AuditInterceptor.class);

    // Only log mutating methods
    private static final Set<String> WRITE_METHODS = Set.of("POST", "PUT", "DELETE", "PATCH");

    // Skip auth and test endpoints — those are logged separately or not needed
    private static final Set<String> SKIP_PREFIXES = Set.of(
            "/api/auth/login",
            "/api/auth/register",
            "/api/test",
            "/api/admin/setup"

    );

    @Autowired private AuditLogRepository auditRepo;
    @Autowired private UserRepository     userRepo;
    @Autowired private BranchRepository   branchRepo;

    @Override
    public void afterCompletion(HttpServletRequest request,
                                HttpServletResponse response,
                                Object handler,
                                Exception ex) {
        String method = request.getMethod();
        if (!WRITE_METHODS.contains(method)) return;

        String path = request.getRequestURI();
        if (SKIP_PREFIXES.stream().anyMatch(path::startsWith)) return;

        // Only log if authenticated
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || !(auth.getPrincipal() instanceof UserDetailsImpl)) {
            return;
        }

        // Run async so it never slows down the API response
        saveAuditLog(auth, method, path, response.getStatus());
    }

    @Async
    protected void saveAuditLog(Authentication auth, String method, String path, int status) {
        try {
            UserDetailsImpl caller = (UserDetailsImpl) auth.getPrincipal();

            AuditLog log = new AuditLog();
            log.setUsername(caller.getUsername());
            log.setAction(resolveAction(method, path));
            log.setEntityType(resolveEntityType(path));
            log.setEntityId(resolveEntityId(path));
            log.setDetails("HTTP " + method + " " + path + " → " + status);
            log.setHttpMethod(method);
            log.setEndpoint(path);
            log.setCreatedAt(LocalDateTime.now());

            // Attach user if found
            userRepo.findById(caller.getId()).ifPresent(log::setUser);

            // Attach branch if user has one
            if (caller.getBranchId() != null) {
                branchRepo.findById(caller.getBranchId()).ifPresent(log::setBranch);
            }

            auditRepo.save(log);
        } catch (Exception e) {
            // Audit must never break anything
            logger.debug("AuditInterceptor failed silently: {}", e.getMessage());
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private String resolveAction(String method, String path) {
        if (method.equals("DELETE"))      return "DELETE";
        if (method.equals("POST")) {
            if (path.contains("/approve")) return "APPROVE";
            if (path.contains("/reject"))  return "REJECT";
            if (path.contains("/confirm")) return "APPROVE";
            if (path.contains("/push"))    return "PUSH";
            if (path.contains("/convert")) return "CONVERT";
            return "CREATE";
        }
        return "UPDATE";
    }

    private String resolveEntityType(String path) {
        if (path.contains("/recipes"))        return "Recipe";
        if (path.contains("/ingredients"))    return "Ingredient";
        if (path.contains("/inventory"))      return "Inventory";
        if (path.contains("/production"))     return "Production";
        if (path.contains("/meal-plans"))     return "MealPlan";
        if (path.contains("/indents"))        return "MaterialIndent";
        if (path.contains("/purchase-orders"))return "PurchaseOrder";
        if (path.contains("/grn"))            return "GoodsReceived";
        if (path.contains("/suppliers"))      return "Supplier";
        if (path.contains("/admin/users"))    return "User";
        if (path.contains("/branches"))       return "Branch";
        if (path.contains("/wastage"))        return "WastageRecord";
        return "Unknown";
    }

    /**
     * Extracts the numeric ID from paths like /api/recipes/42 or /api/indents/7/approve
     * Returns null if no ID segment found.
     */
    private Long resolveEntityId(String path) {
        try {
            String[] parts = path.split("/");
            for (int i = parts.length - 1; i >= 0; i--) {
                if (parts[i].matches("\\d+")) {
                    return Long.parseLong(parts[i]);
                }
            }
        } catch (Exception ignored) {}
        return null;
    }
}