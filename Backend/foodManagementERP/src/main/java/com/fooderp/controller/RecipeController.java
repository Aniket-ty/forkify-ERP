package com.fooderp.controller;

import com.fooderp.dto.RecipeDto;
import com.fooderp.service.RecipeService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/recipes")
@CrossOrigin(origins = "*")
public class RecipeController {

    @Autowired RecipeService recipeService;

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
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // GET /api/recipes/{id}/cost?servings=4
    @GetMapping("/{id}/cost")
    public ResponseEntity<?> getCost(@PathVariable Long id,
                                     @RequestParam(required = false) Integer servings) {
        try {
            return ResponseEntity.ok(recipeService.getRecipeCost(id, servings));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // POST /api/recipes
    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<?> create(@Valid @RequestBody RecipeDto.Request req) {
        try {
            return ResponseEntity.ok(recipeService.createRecipe(req));
        } catch (Exception e) {
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
            return ResponseEntity.notFound().build();
        }
    }
}