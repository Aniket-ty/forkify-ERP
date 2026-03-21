package com.fooderp.controller;

import com.fooderp.dto.ProcurementDto;
import com.fooderp.security.UserDetailsImpl;
import com.fooderp.service.ProcurementService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/indents")
@CrossOrigin(origins = "*")
public class IndentController {

    @Autowired ProcurementService procurementService;

    private Long resolveBranch(Authentication auth, Long branchId) {
        UserDetailsImpl u = (UserDetailsImpl) auth.getPrincipal();
        boolean isAdmin = u.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        return (isAdmin && branchId != null) ? branchId : u.getBranchId();
    }

    // GET /api/indents?branchId=&status=
    @GetMapping
    public ResponseEntity<?> getAll(
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) String status,
            Authentication auth) {
        Long bid = resolveBranch(auth, branchId);
        if (bid == null) return ResponseEntity.badRequest().body("Branch not assigned");
        return ResponseEntity.ok(procurementService.getIndents(bid, status));
    }

    // POST /api/indents?branchId=
    @PostMapping
    public ResponseEntity<?> create(
            @Valid @RequestBody ProcurementDto.IndentRequest req,
            @RequestParam(required = false) Long branchId,
            Authentication auth) {
        try {
            Long bid = resolveBranch(auth, branchId);
            if (bid == null) return ResponseEntity.badRequest().body("Branch not assigned");
            return ResponseEntity.ok(procurementService.createIndent(bid, req));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // PUT /api/indents/{id}/approve
    @PutMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<?> approve(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(procurementService.approveIndent(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // PUT /api/indents/{id}/reject
    @PutMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<?> reject(
            @PathVariable Long id,
            @RequestBody(required = false) RejectRequest req) {
        try {
            String reason = req != null ? req.getReason() : null;
            return ResponseEntity.ok(procurementService.rejectIndent(id, reason));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // POST /api/indents/{id}/convert-to-po?supplierId=
    @PostMapping("/{id}/convert-to-po")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<?> convertToPO(
            @PathVariable Long id,
            @RequestParam Long supplierId) {
        try {
            return ResponseEntity.ok(procurementService.convertIndentToPO(id, supplierId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    public static class RejectRequest {
        private String reason;
        public String getReason() { return reason; }
        public void setReason(String r) { this.reason = r; }
    }
}