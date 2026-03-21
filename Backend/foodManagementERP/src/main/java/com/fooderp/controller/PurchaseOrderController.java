package com.fooderp.controller;

import com.fooderp.dto.ProcurementDto;
import com.fooderp.security.UserDetailsImpl;
import com.fooderp.service.ProcurementService;
import jakarta.validation.Valid;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/purchase-orders")
@CrossOrigin(origins = "*")
public class PurchaseOrderController {

    @Autowired ProcurementService procurementService;

    private Long resolveBranch(Authentication auth, Long branchId) {
        UserDetailsImpl u = (UserDetailsImpl) auth.getPrincipal();
        boolean isAdmin = u.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        return (isAdmin && branchId != null) ? branchId : u.getBranchId();
    }

    // GET /api/purchase-orders?branchId=&status=
    @GetMapping
    public ResponseEntity<?> getAll(@RequestParam(required = false) Long branchId,
                                    @RequestParam(required = false) String status,
                                    Authentication auth) {
        Long bid = resolveBranch(auth, branchId);
        return ResponseEntity.ok(procurementService.getPOs(bid, status));
    }

    // GET /api/purchase-orders/{id}
    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        try { return ResponseEntity.ok(procurementService.getPO(id)); }
        catch (RuntimeException e) { return ResponseEntity.notFound().build(); }
    }

    // POST /api/purchase-orders
    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody ProcurementDto.PORequest req,
                                    @RequestParam(required = false) Long branchId,
                                    Authentication auth) {
        try {
            Long bid = resolveBranch(auth, branchId);
            if (bid == null) return ResponseEntity.badRequest().body("Branch not assigned");
            return ResponseEntity.ok(procurementService.createPO(bid, req));
        } catch (Exception e) { return ResponseEntity.badRequest().body(e.getMessage()); }
    }

    // PUT /api/purchase-orders/{id}/status
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id,
                                          @RequestBody StatusRequest req) {
        try { return ResponseEntity.ok(procurementService.updatePOStatus(id, req.getStatus())); }
        catch (Exception e) { return ResponseEntity.badRequest().body(e.getMessage()); }
    }

    @Data
    static class StatusRequest { private String status; }
}
