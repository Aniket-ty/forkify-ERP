package com.fooderp.dto;

import com.fooderp.entity.Recipe;
import com.fooderp.entity.RecipeIngredient;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.Data;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

public class RecipeDto {

    // ── Create / Update Request ───────────────────────────────────────────────
    @Data
    public static class Request {
        @NotBlank(message = "Recipe name is required")
        private String name;

        private String description;

        @NotBlank(message = "Category is required")
        private String category;

        @Positive(message = "Servings must be positive")
        private Integer servings = 1;

        private Integer prepTime = 0;
        private Integer cookTime = 0;
        private String  status   = "DRAFT";
        private boolean hqOwned  = false;
        private String  tags;
        private String  imageUrl;

        // Nutrition per base serving
        private Double calories = 0.0;
        private Double protein  = 0.0;
        private Double carbs    = 0.0;
        private Double fat      = 0.0;
        private Double fiber    = 0.0;
        private String allergens;

        private List<IngredientLineRequest> ingredients = new ArrayList<>();
    }

    // ── Single ingredient line inside a recipe request ────────────────────────
    @Data
    public static class IngredientLineRequest {
        @Positive(message = "Ingredient id must be positive")
        private Long   ingredientId;
        @Positive(message = "Quantity must be positive")
        private Double quantity;
        private String unit;
        private String notes;
    }

    // ── Full response with ingredients + live cost ────────────────────────────
    @Data
    public static class Response {
        private Long    id;
        private String  name;
        private String  description;
        private String  category;
        private Integer servings;
        private Integer prepTime;
        private Integer cookTime;
        private String  status;
        private boolean hqOwned;
        private List<String> tags;
        private String  imageUrl;
        private Long    branchId;
        private String  branchName;
        private String  createdBy;

        // Nutrition (per base servings)
        private Double calories;
        private Double protein;
        private Double carbs;
        private Double fat;
        private Double fiber;
        private List<String> allergens;

        // Live cost — calculated from ingredient unit prices at request time
        private BigDecimal costPerServing;
        private BigDecimal totalCost;

        private List<IngredientLineResponse> ingredients;
        private String createdAt;
        private String updatedAt;

        public static Response from(Recipe r, BigDecimal totalCost) {
            Response dto = new Response();
            dto.id          = r.getId();
            dto.name        = r.getName();
            dto.description = r.getDescription();
            dto.category    = r.getCategory();
            dto.servings    = r.getServings();
            dto.prepTime    = r.getPrepTime();
            dto.cookTime    = r.getCookTime();
            dto.status      = r.getStatus().name();
            dto.hqOwned     = r.isHqOwned();
            dto.tags        = r.getTags() != null
                    ? Arrays.asList(r.getTags().split(","))
                    : new ArrayList<>();
            dto.imageUrl    = r.getImageUrl();
            dto.branchId    = r.getBranch() != null ? r.getBranch().getId()   : null;
            dto.branchName  = r.getBranch() != null ? r.getBranch().getName() : "HQ";
            dto.createdBy   = r.getCreatedBy() != null ? r.getCreatedBy().getUsername() : null;

            dto.calories = r.getCalories();
            dto.protein  = r.getProtein();
            dto.carbs    = r.getCarbs();
            dto.fat      = r.getFat();
            dto.fiber    = r.getFiber();
            dto.allergens = r.getAllergens() != null
                    ? Arrays.asList(r.getAllergens().split(","))
                    : new ArrayList<>();

            dto.totalCost      = totalCost;
            dto.costPerServing = r.getServings() > 0
                    ? totalCost.divide(BigDecimal.valueOf(r.getServings()), 2, java.math.RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;

            dto.ingredients = r.getIngredients().stream()
                    .map(IngredientLineResponse::from)
                    .collect(Collectors.toList());

            dto.createdAt = r.getCreatedAt() != null ? r.getCreatedAt().toString() : null;
            dto.updatedAt = r.getUpdatedAt() != null ? r.getUpdatedAt().toString() : null;
            return dto;
        }
    }

    // ── Ingredient line inside recipe response ────────────────────────────────
    @Data
    public static class IngredientLineResponse {
        private Long   id;
        private Long   ingredientId;
        private String ingredientName;
        private String category;
        private Double quantity;
        private String unit;
        private String notes;
        private BigDecimal unitCost;
        private BigDecimal lineCost;

        public static IngredientLineResponse from(RecipeIngredient ri) {
            IngredientLineResponse r = new IngredientLineResponse();
            r.id             = ri.getId();
            r.ingredientId   = ri.getIngredient().getId();
            r.ingredientName = ri.getIngredient().getName();
            r.category       = ri.getIngredient().getCategory();
            r.quantity       = ri.getQuantity();
            r.unit           = ri.getUnit() != null ? ri.getUnit() : ri.getIngredient().getUnit();
            r.notes          = ri.getNotes();
            r.unitCost       = ri.getIngredient().getCostPerUnit();
            r.lineCost       = ri.getIngredient().getCostPerUnit()
                    .multiply(BigDecimal.valueOf(ri.getQuantity()))
                    .setScale(2, java.math.RoundingMode.HALF_UP);
            return r;
        }
    }

    // ── Summary for list views (no ingredient details) ────────────────────────
    @Data
    public static class Summary {
        private Long    id;
        private String  name;
        private String  category;
        private Integer servings;
        private Integer prepTime;
        private Integer cookTime;
        private String  status;
        private boolean hqOwned;
        private List<String> tags;
        private String  imageUrl;
        private BigDecimal costPerServing;
        private Double  calories;
        private String  branchName;

        public static Summary from(Recipe r, BigDecimal totalCost) {
            Summary s = new Summary();
            s.id       = r.getId();
            s.name     = r.getName();
            s.category = r.getCategory();
            s.servings = r.getServings();
            s.prepTime = r.getPrepTime();
            s.cookTime = r.getCookTime();
            s.status   = r.getStatus().name();
            s.hqOwned  = r.isHqOwned();
            s.tags     = r.getTags() != null
                    ? Arrays.asList(r.getTags().split(","))
                    : new ArrayList<>();
            s.imageUrl    = r.getImageUrl();
            s.calories    = r.getCalories();
            s.branchName  = r.getBranch() != null ? r.getBranch().getName() : "HQ";
            s.costPerServing = r.getServings() > 0
                    ? totalCost.divide(BigDecimal.valueOf(r.getServings()), 2, java.math.RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;
            return s;
        }
    }
}