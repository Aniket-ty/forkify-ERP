package com.fooderp.controller;

import com.fooderp.dto.RecipeDto;
import com.fooderp.entity.RecipeStep;
import com.fooderp.repository.RecipeStepRepository;
import com.fooderp.service.RecipeService;
import jakarta.validation.Valid;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/recipes")
@CrossOrigin(origins = "*")
public class RecipeController {

    @Autowired private RecipeService         recipeService;
    @Autowired private RecipeStepRepository  recipeStepRepo;

    // GET /api/recipes?search=&category=
    @GetMapping
    public ResponseEntity<?> getAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category) {
        return ResponseEntity.ok(recipeService.getRecipes(search, category));
    }

    // GET /api/recipes/categories
    @GetMapping("/categories")
    public ResponseEntity<?> getCategories() {
        return ResponseEntity.ok(recipeService.getCategories());
    }

    // GET /api/recipes/{id}
    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(recipeService.getRecipeById(id));
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // GET /api/recipes/{id}/cost
    @GetMapping("/{id}/cost")
    public ResponseEntity<?> getCost(@PathVariable Long id,
                                     @RequestParam(required = false) Integer servings) {
        try {
            return ResponseEntity.ok(recipeService.getCostBreakdown(id, servings));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // POST /api/recipes
    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<?> create(@Valid @RequestBody RecipeDto.Request req) {
        try {
            return ResponseEntity.ok(recipeService.createRecipe(req));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // PUT /api/recipes/{id}
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<?> update(@PathVariable Long id,
                                    @Valid @RequestBody RecipeDto.Request req) {
        try {
            return ResponseEntity.ok(recipeService.updateRecipe(id, req));
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // DELETE /api/recipes/{id}  — admin only
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            recipeService.deleteRecipe(id);
            return ResponseEntity.ok("Recipe deleted successfully");
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ── Steps endpoints ───────────────────────────────────────────────────────

    // GET /api/recipes/{id}/steps
    @GetMapping("/{id}/steps")
    public ResponseEntity<?> getSteps(@PathVariable Long id) {
        return ResponseEntity.ok(recipeStepRepo.findByRecipeIdOrderByStepNumberAsc(id));
    }

    // POST /api/recipes/{id}/steps
    @PostMapping("/{id}/steps")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<?> createStep(@PathVariable Long id,
                                        @RequestBody StepRequest req) {
        try {
            return ResponseEntity.ok(recipeService.addStep(id, req.getStepNumber(),
                    req.getTitle(), req.getInstruction(), req.getDurationMinutes()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // DELETE /api/recipes/{id}/steps  — clears ALL steps for a recipe
    // Called by frontend before re-posting updated steps on edit
    @DeleteMapping("/{id}/steps")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<?> deleteAllSteps(@PathVariable Long id) {
        try {
            recipeStepRepo.deleteByRecipeId(id);
            return ResponseEntity.ok("Steps cleared");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // DELETE /api/recipes/{id}/steps/{stepId}  — delete a single step
    @DeleteMapping("/{id}/steps/{stepId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<?> deleteStep(@PathVariable Long id,
                                        @PathVariable Long stepId) {
        try {
            recipeStepRepo.deleteById(stepId);
            return ResponseEntity.ok("Step deleted");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @Data
    public static class StepRequest {
        private Integer stepNumber;
        private String  title;
        private String  instruction;
        private Integer durationMinutes;
    }
}