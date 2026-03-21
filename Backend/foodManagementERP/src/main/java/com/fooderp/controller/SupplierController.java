// ── SupplierController.java ───────────────────────────────────────────────────
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
@RequestMapping("/api/suppliers")
@CrossOrigin(origins = "*")
public class SupplierController {

    @Autowired ProcurementService procurementService;

    private Long resolveBranch(Authentication auth, Long branchId) {
        UserDetailsImpl u = (UserDetailsImpl) auth.getPrincipal();
        boolean isAdmin = u.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        return (isAdmin && branchId != null) ? branchId : u.getBranchId();
    }

    @GetMapping
    public ResponseEntity<?> getAll(@RequestParam(required = false) Long branchId, Authentication auth) {
        return ResponseEntity.ok(procurementService.getSuppliers(resolveBranch(auth, branchId)));
    }

    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody ProcurementDto.SupplierRequest req,
                                    @RequestParam(required = false) Long branchId, Authentication auth) {
        try {
            return ResponseEntity.ok(procurementService.createSupplier(resolveBranch(auth, branchId), req));
        } catch (Exception e) { return ResponseEntity.badRequest().body(e.getMessage()); }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id,
                                    @Valid @RequestBody ProcurementDto.SupplierRequest req) {
        try {
            return ResponseEntity.ok(procurementService.updateSupplier(id, req));
        } catch (Exception e) { return ResponseEntity.badRequest().body(e.getMessage()); }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try { procurementService.deleteSupplier(id); return ResponseEntity.ok("Supplier deactivated"); }
        catch (Exception e) { return ResponseEntity.badRequest().body(e.getMessage()); }
    }

    @GetMapping("/approved")
    public ResponseEntity<?> getApproved() {
        return ResponseEntity.ok(procurementService.getApprovedVendors());
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> approve(@PathVariable Long id) {
        try { return ResponseEntity.ok(procurementService.approveVendor(id)); }
        catch (Exception e) { return ResponseEntity.badRequest().body(e.getMessage()); }
    }
}
