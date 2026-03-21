package com.fooderp.controller;

import com.fooderp.dto.MealPlanDto;
import com.fooderp.security.UserDetailsImpl;
import com.fooderp.service.MealPlanService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/meal-plans")
@CrossOrigin(origins = "*")
public class MealPlanController {

    @Autowired MealPlanService mealPlanService;

    private Long resolveBranch(Authentication auth, Long branchId) {
        UserDetailsImpl user = (UserDetailsImpl) auth.getPrincipal();
        boolean isAdmin = user.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        return (isAdmin && branchId != null) ? branchId : user.getBranchId();
    }

    // GET /api/meal-plans?branchId=&week=&year=
    @GetMapping
    public ResponseEntity<?> getAll(
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) Integer week,
            @RequestParam(required = false) Integer year,
            Authentication auth) {
        Long bid = resolveBranch(auth, branchId);
        return ResponseEntity.ok(mealPlanService.getPlans(bid, week, year));
    }

    // GET /api/meal-plans/{id}
    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(mealPlanService.getById(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // POST /api/meal-plans
    @PostMapping
    public ResponseEntity<?> create(
            @Valid @RequestBody MealPlanDto.Request req,
            @RequestParam(required = false) Long branchId,
            Authentication auth) {
        try {
            Long bid = resolveBranch(auth, branchId);
            return ResponseEntity.ok(mealPlanService.create(req, bid));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // PUT /api/meal-plans/{id}
    @PutMapping("/{id}")
    public ResponseEntity<?> update(
            @PathVariable Long id,
            @Valid @RequestBody MealPlanDto.Request req) {
        try {
            return ResponseEntity.ok(mealPlanService.update(id, req));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // DELETE /api/meal-plans/{id}
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            mealPlanService.delete(id);
            return ResponseEntity.ok("Meal plan deleted");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // POST /api/meal-plans/{id}/push-to-branches
    // Body (optional): { "branchIds": [1,2,3] }  — if empty, pushes to ALL active branches
    @PostMapping("/{id}/push-to-branches")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> pushToBranches(
            @PathVariable Long id,
            @RequestBody(required = false) List<Long> branchIds) {
        try {
            return ResponseEntity.ok(mealPlanService.pushToBranches(id, branchIds));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // GET /api/meal-plans/{id}/forecast?branchId=
    @GetMapping("/{id}/forecast")
    public ResponseEntity<?> getForecast(
            @PathVariable Long id,
            @RequestParam(required = false) Long branchId,
            Authentication auth) {
        try {
            Long bid = resolveBranch(auth, branchId);
            return ResponseEntity.ok(mealPlanService.getForecast(id, bid));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // GET /api/meal-plans/{id}/shortage  — convenience: just the shortage list
    @GetMapping("/{id}/shortage")
    public ResponseEntity<?> getShortage(
            @PathVariable Long id,
            @RequestParam(required = false) Long branchId,
            Authentication auth) {
        try {
            Long bid = resolveBranch(auth, branchId);
            MealPlanDto.ForecastResponse forecast = mealPlanService.getForecast(id, bid);
            return ResponseEntity.ok(forecast.getShortages());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // GET /api/meal-plans/{id}/shopping-list  — items that need to be procured
    @GetMapping("/{id}/shopping-list")
    public ResponseEntity<?> getShoppingList(
            @PathVariable Long id,
            @RequestParam(required = false) Long branchId,
            Authentication auth) {
        try {
            Long bid = resolveBranch(auth, branchId);
            MealPlanDto.ForecastResponse forecast = mealPlanService.getForecast(id, bid);
            // Shopping list = shortages only (what needs to be ordered)
            return ResponseEntity.ok(forecast.getShortages());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
