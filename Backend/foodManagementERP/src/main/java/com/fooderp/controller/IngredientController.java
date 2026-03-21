package com.fooderp.controller;

import com.fooderp.dto.IngredientDto;
import com.fooderp.entity.Ingredient;
import com.fooderp.repository.IngredientRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/ingredients")
@CrossOrigin(origins = "*")
public class IngredientController {

    @Autowired IngredientRepository ingredientRepo;

    // GET /api/ingredients  — all active ingredients (any authenticated user)
    @GetMapping
    public ResponseEntity<?> getAll(@RequestParam(required = false) String q,
                                    @RequestParam(required = false) String category) {
        List<Ingredient> list;
        if (q != null && !q.isBlank()) {
            list = ingredientRepo.searchByName(q);
        } else if (category != null && !category.isBlank()) {
            list = ingredientRepo.findByCategoryAndActiveTrueOrderByNameAsc(category);
        } else {
            list = ingredientRepo.findByActiveTrueOrderByNameAsc();
        }
        return ResponseEntity.ok(list.stream().map(IngredientDto.Response::from).collect(Collectors.toList()));
    }

    // GET /api/ingredients/categories
    @GetMapping("/categories")
    public ResponseEntity<?> getCategories() {
        return ResponseEntity.ok(ingredientRepo.findDistinctCategories());
    }

    // GET /api/ingredients/{id}
    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        return ingredientRepo.findById(id)
                .map(i -> ResponseEntity.ok(IngredientDto.Response.from(i)))
                .orElse(ResponseEntity.notFound().build());
    }

    // POST /api/ingredients  — admin only
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> create(@Valid @RequestBody IngredientDto.Request req) {
        if (ingredientRepo.existsByNameIgnoreCase(req.getName())) {
            return ResponseEntity.badRequest().body("Ingredient already exists: " + req.getName());
        }
        Ingredient i = new Ingredient();
        mapToEntity(req, i);
        return ResponseEntity.ok(IngredientDto.Response.from(ingredientRepo.save(i)));
    }

    // PUT /api/ingredients/{id}  — admin only
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> update(@PathVariable Long id,
                                    @Valid @RequestBody IngredientDto.Request req) {
        return ingredientRepo.findById(id).map(i -> {
            mapToEntity(req, i);
            return ResponseEntity.ok(IngredientDto.Response.from(ingredientRepo.save(i)));
        }).orElse(ResponseEntity.notFound().build());
    }

    // DELETE /api/ingredients/{id}  — admin only (soft delete)
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        return ingredientRepo.findById(id).map(i -> {
            i.setActive(false);
            ingredientRepo.save(i);
            return ResponseEntity.ok("Ingredient deactivated");
        }).orElse(ResponseEntity.notFound().build());
    }

    private void mapToEntity(IngredientDto.Request req, Ingredient i) {
        i.setName(req.getName());
        i.setUnit(req.getUnit());
        i.setCategory(req.getCategory());
        i.setCostPerUnit(req.getCostPerUnit());
        i.setCaloriesPerUnit(req.getCaloriesPerUnit() != null ? req.getCaloriesPerUnit() : 0.0);
        i.setProteinPerUnit(req.getProteinPerUnit()   != null ? req.getProteinPerUnit()  : 0.0);
        i.setCarbsPerUnit(req.getCarbsPerUnit()       != null ? req.getCarbsPerUnit()    : 0.0);
        i.setFatPerUnit(req.getFatPerUnit()           != null ? req.getFatPerUnit()      : 0.0);
        i.setFiberPerUnit(req.getFiberPerUnit()       != null ? req.getFiberPerUnit()    : 0.0);
        i.setAllergens(req.getAllergens());
    }
}