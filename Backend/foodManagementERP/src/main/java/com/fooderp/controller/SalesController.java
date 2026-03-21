package com.fooderp.controller;

import com.fooderp.security.UserDetailsImpl;
import com.fooderp.service.SalesService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/sales")
@CrossOrigin(origins = "*")
public class SalesController {

    @Autowired private SalesService salesService;

    private Long resolveBranch(Authentication auth, Long branchId) {
        UserDetailsImpl u = (UserDetailsImpl) auth.getPrincipal();
        boolean isAdmin = u.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        return (isAdmin && branchId != null) ? branchId : u.getBranchId();
    }

    // POST /api/sales — log daily sales entry
    @PostMapping
    public ResponseEntity<?> logSales(@RequestBody SalesService.SalesRequest req,
                                       @RequestParam(required = false) Long branchId,
                                       Authentication auth) {
        try {
            Long bid = resolveBranch(auth, branchId);
            if (bid == null) return ResponseEntity.badRequest().body("Branch not assigned");
            return ResponseEntity.ok(salesService.logSales(bid, req));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // GET /api/sales?branchId=&date=yyyy-MM-dd
    @GetMapping
    public ResponseEntity<?> getSales(@RequestParam(required = false) Long branchId,
                                       @RequestParam(required = false) String date,
                                       Authentication auth) {
        Long bid = resolveBranch(auth, branchId);
        if (bid == null) return ResponseEntity.badRequest().body("Branch not assigned");
        return ResponseEntity.ok(salesService.getSales(bid, date));
    }
}
