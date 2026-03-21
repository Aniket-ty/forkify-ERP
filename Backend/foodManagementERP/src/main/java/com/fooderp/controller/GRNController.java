package com.fooderp.controller;

import com.fooderp.dto.ProcurementDto;
import com.fooderp.security.UserDetailsImpl;
import com.fooderp.service.ProcurementService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/grn")
@CrossOrigin(origins = "*")
public class GRNController {

    @Autowired ProcurementService procurementService;

    private Long resolveBranch(Authentication auth, Long branchId) {
        UserDetailsImpl u = (UserDetailsImpl) auth.getPrincipal();
        boolean isAdmin = u.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        return (isAdmin && branchId != null) ? branchId : u.getBranchId();
    }

    // GET /api/grn?branchId=
    @GetMapping
    public ResponseEntity<?> getAll(@RequestParam(required = false) Long branchId,
                                    Authentication auth) {
        Long bid = resolveBranch(auth, branchId);
        if (bid == null) return ResponseEntity.badRequest().body("Branch not assigned");
        return ResponseEntity.ok(procurementService.getGRNs(bid));
    }

    // POST /api/grn
    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody ProcurementDto.GRNRequest req,
                                    @RequestParam(required = false) Long branchId,
                                    Authentication auth) {
        try {
            Long bid = resolveBranch(auth, branchId);
            if (bid == null) return ResponseEntity.badRequest().body("Branch not assigned");
            return ResponseEntity.ok(procurementService.createGRN(bid, req));
        } catch (Exception e) { return ResponseEntity.badRequest().body(e.getMessage()); }
    }

    // PUT /api/grn/{id}/confirm  — triggers stock-in
    @PutMapping("/{id}/confirm")
    public ResponseEntity<?> confirm(@PathVariable Long id) {
        try { return ResponseEntity.ok(procurementService.confirmGRN(id)); }
        catch (Exception e) { return ResponseEntity.badRequest().body(e.getMessage()); }
    }
}
