package com.fooderp.controller;

import com.fooderp.entity.Recipe;
import com.fooderp.repository.RecipeRepository;
import jakarta.transaction.Transactional;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/allergens")
@CrossOrigin(origins = "*")
public class AllergenController {

    @Autowired RecipeRepository recipeRepo;

    // Known allergens list
    private static final List<String> ALL_ALLERGENS = List.of(
            "Gluten", "Dairy", "Eggs", "Nuts", "Peanuts",
            "Soy", "Fish", "Shellfish", "Sesame", "Mustard",
            "Celery", "Sulphites", "Lupin", "Molluscs"
    );

    // GET /api/allergens/matrix — full allergen x recipe matrix
    @GetMapping("/matrix")
    @Transactional
    public ResponseEntity<?> getMatrix(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String status) {

        List<Recipe> recipes = recipeRepo.findAll().stream()
                .filter(r -> status == null || r.getStatus().name().equalsIgnoreCase(status))
                .filter(r -> category == null || r.getCategory().equalsIgnoreCase(category))
                .collect(Collectors.toList());

        AllergenMatrix matrix = new AllergenMatrix();
        matrix.setAllergens(ALL_ALLERGENS);
        matrix.setRecipes(recipes.stream().map(r -> {
                    RecipeAllergenRow row = new RecipeAllergenRow();
                    row.setRecipeId(r.getId()); row.setRecipeName(r.getName());
                    row.setCategory(r.getCategory()); row.setStatus(r.getStatus().name());

                    // Collect allergens from recipe itself + ingredients
                    Set<String> recipeAllergens = new HashSet<>();
                    if (r.getAllergens() != null && !r.getAllergens().isBlank()) {
                        Arrays.stream(r.getAllergens().split(",")).map(String::trim).forEach(recipeAllergens::add);
                    }
                    r.getIngredients().forEach(ri -> {
                        if (ri.getIngredient().getAllergens() != null && !ri.getIngredient().getAllergens().isBlank()) {
                            Arrays.stream(ri.getIngredient().getAllergens().split(",")).map(String::trim).forEach(recipeAllergens::add);
                        }
                    });
                    row.setAllergenSet(recipeAllergens);

                    // Boolean map per allergen
                    Map<String, Boolean> allergenMap = new LinkedHashMap<>();
                    ALL_ALLERGENS.forEach(a -> allergenMap.put(a, recipeAllergens.stream()
                            .anyMatch(ra -> ra.equalsIgnoreCase(a))));
                    row.setAllergenMap(allergenMap);
                    row.setAllergenCount((int) allergenMap.values().stream().filter(Boolean::booleanValue).count());
                    return row;
                }).sorted(Comparator.comparing(RecipeAllergenRow::getCategory).thenComparing(RecipeAllergenRow::getRecipeName))
                .collect(Collectors.toList()));

        // Summary: count of recipes per allergen
        Map<String, Long> summary = new LinkedHashMap<>();
        ALL_ALLERGENS.forEach(a -> summary.put(a, matrix.getRecipes().stream()
                .filter(r -> Boolean.TRUE.equals(r.getAllergenMap().get(a))).count()));
        matrix.setSummary(summary);

        return ResponseEntity.ok(matrix);
    }

    // GET /api/allergens/list — all known allergens
    @GetMapping("/list")
    @Transactional
    public ResponseEntity<?> getAllergenList() {
        return ResponseEntity.ok(Map.of("allergens", ALL_ALLERGENS));
    }

    // GET /api/allergens/recipe/{id} — allergens for a specific recipe
    @GetMapping("/recipe/{id}")
    public ResponseEntity<?> getForRecipe(@PathVariable Long id) {
        return recipeRepo.findById(id).map(r -> {
            Set<String> allergens = new HashSet<>();
            if (r.getAllergens() != null)
                Arrays.stream(r.getAllergens().split(",")).map(String::trim).filter(s -> !s.isBlank()).forEach(allergens::add);
            r.getIngredients().forEach(ri -> {
                if (ri.getIngredient().getAllergens() != null)
                    Arrays.stream(ri.getIngredient().getAllergens().split(",")).map(String::trim).filter(s -> !s.isBlank()).forEach(allergens::add);
            });
            return ResponseEntity.ok(Map.of(
                    "recipeId", r.getId(), "recipeName", r.getName(),
                    "allergens", allergens, "allergenCount", allergens.size(),
                    "safe", allergens.isEmpty()
            ));
        }).orElse(ResponseEntity.notFound().build());
    }

    @Data public static class AllergenMatrix {
        private List<String> allergens; private List<RecipeAllergenRow> recipes; private Map<String, Long> summary;
    }
    @Data public static class RecipeAllergenRow {
        private Long recipeId; private String recipeName, category, status;
        private Set<String> allergenSet; private Map<String, Boolean> allergenMap; private int allergenCount;
    }
}