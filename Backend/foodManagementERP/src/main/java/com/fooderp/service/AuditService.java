package com.fooderp.service;

import com.fooderp.entity.AuditLog;
import com.fooderp.entity.Branch;
import com.fooderp.entity.User;
import com.fooderp.repository.AuditLogRepository;
import com.fooderp.repository.BranchRepository;
import com.fooderp.repository.UserRepository;
import com.fooderp.security.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AuditService {

    @Autowired private AuditLogRepository auditRepo;
    @Autowired private UserRepository     userRepo;
    @Autowired private BranchRepository   branchRepo;

    /**
     * Log any write action. Call this from services after mutating data.
     * Runs async so it never blocks the main request.
     */
    @Async
    public void log(String action, String entityType, Long entityId,
                    String entityName, String details) {
        try {
            UserDetailsImpl caller = getCaller();
            if (caller == null) return;

            AuditLog log = new AuditLog();
            log.setAction(action);
            log.setEntityType(entityType);
            log.setEntityId(entityId);
            log.setEntityName(entityName);
            log.setDetails(details);
            log.setUsername(caller.getUsername());

            userRepo.findById(caller.getId()).ifPresent(log::setUser);
            if (caller.getBranchId() != null) {
                branchRepo.findById(caller.getBranchId()).ifPresent(log::setBranch);
            }

            auditRepo.save(log);
        } catch (Exception ignored) {
            // Audit failures must never break the main flow
        }
    }

    public List<AuditLog> search(String username, String action,
                                  String entityType, String from, String to) {
        LocalDateTime fromDt = (from != null && !from.isBlank())
                ? LocalDateTime.parse(from + "T00:00:00") : null;
        LocalDateTime toDt   = (to   != null && !to.isBlank())
                ? LocalDateTime.parse(to   + "T23:59:59") : null;

        String u  = (username   != null && !username.isBlank())   ? username   : null;
        String a  = (action     != null && !action.isBlank())     ? action     : null;
        String et = (entityType != null && !entityType.isBlank()) ? entityType : null;

        if (u == null && a == null && et == null && fromDt == null && toDt == null) {
            return auditRepo.findTop100ByOrderByCreatedAtDesc();
        }
        return auditRepo.search(u, a, et, fromDt, toDt);
    }

    private UserDetailsImpl getCaller() {
        try {
            return (UserDetailsImpl) SecurityContextHolder.getContext()
                    .getAuthentication().getPrincipal();
        } catch (Exception e) {
            return null;
        }
    }
}
