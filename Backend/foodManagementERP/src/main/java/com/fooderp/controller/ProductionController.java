package com.fooderp.controller;

import com.fooderp.dto.InventoryDto;
import com.fooderp.dto.ProductionDto;
import com.fooderp.entity.FinishedGoodStock;
import com.fooderp.security.UserDetailsImpl;
import com.fooderp.service.ProductionService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/production")
@CrossOrigin(origins = "*")
public class ProductionController {

    @Autowired ProductionService productionService;

    private Long resolveBranch(Authentication auth, Long branchId) {
        UserDetailsImpl user = (UserDetailsImpl) auth.getPrincipal();
        boolean isAdmin = user.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        return (isAdmin && branchId != null) ? branchId : user.getBranchId();
    }

    // GET /api/production/preview?recipeId=&servings=&branchId=
    @GetMapping("/preview")
    public ResponseEntity<?> preview(
            @RequestParam Long recipeId,
            @RequestParam Integer servings,
            @RequestParam(required = false) Long branchId,
            Authentication auth) {
        try {
            Long bid = resolveBranch(auth, branchId);
            if (bid == null) return ResponseEntity.badRequest().body("Branch not assigned");
            return ResponseEntity.ok(productionService.preview(bid, recipeId, servings));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // POST /api/production — log production, deduct ingredients, add to FinishedGoodStock
    @PostMapping
    public ResponseEntity<?> logProduction(
            @Valid @RequestBody ProductionDto.Request req,
            @RequestParam(required = false) Long branchId,
            Authentication auth) {
        try {
            Long bid = resolveBranch(auth, branchId);
            if (bid == null) return ResponseEntity.badRequest().body("Branch not assigned");
            return ResponseEntity.ok(productionService.logProduction(bid, req));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // GET /api/production?branchId=&date=&recipeId=
    @GetMapping
    public ResponseEntity<?> getHistory(
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) String date,
            @RequestParam(required = false) Long recipeId,
            Authentication auth) {
        Long bid = resolveBranch(auth, branchId);
        if (bid == null) return ResponseEntity.badRequest().body("Branch not assigned");
        return ResponseEntity.ok(productionService.getHistory(bid, date, recipeId));
    }

    // GET /api/production/stock?branchId= — finished good stock levels
    @GetMapping("/stock")
    public ResponseEntity<?> getFinishedStock(
            @RequestParam(required = false) Long branchId,
            Authentication auth) {
        Long bid = resolveBranch(auth, branchId);
        if (bid == null) return ResponseEntity.badRequest().body("Branch not assigned");
        List<FinishedGoodStock> stocks = productionService.getStockLevels(bid);
        return ResponseEntity.ok(stocks.stream()
                .map(InventoryDto.FinishedStockResponse::from)
                .collect(Collectors.toList()));
    }
}