package com.fooderp.controller;

import com.fooderp.dto.InventoryDto;
import com.fooderp.security.UserDetailsImpl;
import com.fooderp.service.InventoryService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/inventory")
@CrossOrigin(origins = "*")
public class InventoryController {

    @Autowired InventoryService inventoryService;

    // ── Helper: resolve branchId (branch users use their own, admins pass it) ─
    private Long resolveBranch(Authentication auth, Long branchId) {
        UserDetailsImpl user = (UserDetailsImpl) auth.getPrincipal();
        boolean isAdmin = user.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (isAdmin && branchId != null) return branchId;
        return user.getBranchId();
    }

    // GET /api/inventory/summary?branchId=
    @GetMapping("/summary")
    public ResponseEntity<?> getSummary(@RequestParam(required = false) Long branchId,
                                        Authentication auth) {
        Long bid = resolveBranch(auth, branchId);
        if (bid == null) return ResponseEntity.badRequest().body("Branch not assigned");
        return ResponseEntity.ok(inventoryService.getSummary(bid));
    }

    // GET /api/inventory?branchId=
    @GetMapping
    public ResponseEntity<?> getAll(@RequestParam(required = false) Long branchId,
                                    Authentication auth) {
        Long bid = resolveBranch(auth, branchId);
        if (bid == null) return ResponseEntity.badRequest().body("Branch not assigned");
        return ResponseEntity.ok(inventoryService.getInventory(bid));
    }

    // GET /api/inventory/low-stock?branchId=
    @GetMapping("/low-stock")
    public ResponseEntity<?> getLowStock(@RequestParam(required = false) Long branchId,
                                         Authentication auth) {
        Long bid = resolveBranch(auth, branchId);
        if (bid == null) return ResponseEntity.badRequest().body("Branch not assigned");
        return ResponseEntity.ok(inventoryService.getLowStock(bid));
    }

    // GET /api/inventory/expiring?branchId=&days=7
    @GetMapping("/expiring")
    public ResponseEntity<?> getExpiring(@RequestParam(required = false) Long branchId,
                                         @RequestParam(defaultValue = "7") int days,
                                         Authentication auth) {
        Long bid = resolveBranch(auth, branchId);
        if (bid == null) return ResponseEntity.badRequest().body("Branch not assigned");
        return ResponseEntity.ok(inventoryService.getExpiring(bid, days));
    }

    // POST /api/inventory  — create or update inventory item
    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<?> upsertItem(@Valid @RequestBody InventoryDto.ItemRequest req,
                                        @RequestParam(required = false) Long branchId,
                                        Authentication auth) {
        try {
            Long bid = resolveBranch(auth, branchId);
            if (bid == null) return ResponseEntity.badRequest().body("Branch not assigned");
            return ResponseEntity.ok(inventoryService.upsertItem(bid, req));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // POST /api/inventory/stock-in
    @PostMapping("/stock-in")
    public ResponseEntity<?> stockIn(@Valid @RequestBody InventoryDto.StockInRequest req,
                                     @RequestParam(required = false) Long branchId,
                                     Authentication auth) {
        try {
            Long bid = resolveBranch(auth, branchId);
            if (bid == null) return ResponseEntity.badRequest().body("Branch not assigned");
            return ResponseEntity.ok(inventoryService.stockIn(bid, req));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // GET /api/inventory/transactions?branchId=&type=
    @GetMapping("/transactions")
    public ResponseEntity<?> getTransactions(@RequestParam(required = false) Long branchId,
                                             @RequestParam(required = false) String type,
                                             Authentication auth) {
        Long bid = resolveBranch(auth, branchId);
        if (bid == null) return ResponseEntity.badRequest().body("Branch not assigned");
        return ResponseEntity.ok(inventoryService.getTransactions(bid, type));
    }

    // POST /api/inventory/wastage
    @PostMapping("/wastage")
    public ResponseEntity<?> logWastage(@Valid @RequestBody InventoryDto.WastageRequest req,
                                        @RequestParam(required = false) Long branchId,
                                        Authentication auth) {
        try {
            Long bid = resolveBranch(auth, branchId);
            if (bid == null) return ResponseEntity.badRequest().body("Branch not assigned");
            return ResponseEntity.ok(inventoryService.logWastage(bid, req));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // GET /api/inventory/wastage?branchId=&status=
    @GetMapping("/wastage")
    public ResponseEntity<?> getWastage(@RequestParam(required = false) Long branchId,
                                        @RequestParam(required = false) String status,
                                        Authentication auth) {
        Long bid = resolveBranch(auth, branchId);
        if (bid == null) return ResponseEntity.badRequest().body("Branch not assigned");
        return ResponseEntity.ok(inventoryService.getWastage(bid, status));
    }

    // PUT /api/inventory/wastage/{id}/approve
    @PutMapping("/wastage/{id}/approve")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<?> approveWastage(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(inventoryService.approveWastage(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // PUT /api/inventory/wastage/{id}/reject
    @PutMapping("/wastage/{id}/reject")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<?> rejectWastage(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(inventoryService.rejectWastage(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}