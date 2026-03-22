package com.fooderp.dto;

import com.fooderp.entity.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class RecipeDto {

    // ── Create / Update request ───────────────────────────────────────────────
    @Data
    public static class Request {
        @NotBlank(message = "Recipe name is required")
        private String  name;
        private String  description;

        @NotBlank(message = "Category is required")
        private String  category;

        @NotNull @Positive
        private Integer servings    = 4;
        private Integer prepTime    = 0;
        private Integer cookTime    = 0;

        private String  status      = "DRAFT";
        private boolean hqOwned     = false;
        private String  tags;
        private String  allergens;
        private String  imageUrl;

        // Nutrition
        private Double  calories;
        private Double  protein;
        private Double  carbs;
        private Double  fat;
        private Double  fiber;

        // Ingredients
        private List<IngredientRequest> ingredients = new ArrayList<>();

        // Cooking steps — saved separately to recipe_steps table
        private List<StepRequest> steps = new ArrayList<>();
    }

    // ── Ingredient request ────────────────────────────────────────────────────
    @Data
    public static class IngredientRequest {
        @NotNull
        private Long    ingredientId;
        @NotNull @Positive
        private Double  quantity;
        private String  unit;
        private String  notes;
    }

    // ── Step request ──────────────────────────────────────────────────────────
    @Data
    public static class StepRequest {
        private Integer stepNumber;
        private String  title;
        private String  instruction;
        private Integer durationMinutes;
    }

    // ── Summary (list view) ───────────────────────────────────────────────────
    @Data
    public static class Summary {
        private Long       id;
        private String     name;
        private String     description;
        private String     category;
        private Integer    servings;
        private Integer    prepTime;
        private Integer    cookTime;
        private String     status;
        private boolean    hqOwned;
        private String     tags;
        private String     allergens;
        private Double     calories;
        private Double     protein;
        private Double     carbs;
        private Double     fat;
        private Double     fiber;
        private BigDecimal costPerServing;
        private String     branchName;
        private String     createdAt;

        public static Summary from(Recipe r, BigDecimal totalCost) {
            Summary s = new Summary();
            s.id          = r.getId();
            s.name        = r.getName();
            s.description = r.getDescription();
            s.category    = r.getCategory();
            s.servings    = r.getServings();
            s.prepTime    = r.getPrepTime();
            s.cookTime    = r.getCookTime();
            s.status      = r.getStatus() != null ? r.getStatus().name() : "DRAFT";
            s.hqOwned     = r.isHqOwned();
            s.tags        = r.getTags();
            s.allergens   = r.getAllergens();
            s.calories    = r.getCalories();
            s.protein     = r.getProtein();
            s.carbs       = r.getCarbs();
            s.fat         = r.getFat();
            s.fiber       = r.getFiber();
            s.costPerServing = r.getServings() != null && r.getServings() > 0
                    ? totalCost.divide(BigDecimal.valueOf(r.getServings()), 2, java.math.RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;
            s.branchName  = r.getBranch() != null ? r.getBranch().getName() : "HQ";
            s.createdAt   = r.getCreatedAt() != null ? r.getCreatedAt().toString() : null;
            return s;
        }
    }

    // ── Full response (detail view) ───────────────────────────────────────────
    @Data
    public static class Response {
        private Long                id;
        private String              name;
        private String              description;
        private String              category;
        private Integer             servings;
        private Integer             prepTime;
        private Integer             cookTime;
        private String              status;
        private boolean             hqOwned;
        private String              tags;
        private String              allergens;
        private String              imageUrl;
        private Double              calories;
        private Double              protein;
        private Double              carbs;
        private Double              fat;
        private Double              fiber;
        private BigDecimal          costPerServing;
        private BigDecimal          totalCost;
        private Long                branchId;
        private String              branchName;
        private String              createdBy;
        private String              createdAt;
        private String              updatedAt;
        private List<IngredientResponse> ingredients;
        private List<StepResponse>       steps;

        public static Response from(Recipe r, BigDecimal totalCost) {
            Response res = new Response();
            res.id          = r.getId();
            res.name        = r.getName();
            res.description = r.getDescription();
            res.category    = r.getCategory();
            res.servings    = r.getServings();
            res.prepTime    = r.getPrepTime();
            res.cookTime    = r.getCookTime();
            res.status      = r.getStatus() != null ? r.getStatus().name() : "DRAFT";
            res.hqOwned     = r.isHqOwned();
            res.tags        = r.getTags();
            res.allergens   = r.getAllergens();
            res.imageUrl    = r.getImageUrl();
            res.calories    = r.getCalories();
            res.protein     = r.getProtein();
            res.carbs       = r.getCarbs();
            res.fat         = r.getFat();
            res.fiber       = r.getFiber();
            res.totalCost   = totalCost;
            res.costPerServing = r.getServings() != null && r.getServings() > 0
                    ? totalCost.divide(BigDecimal.valueOf(r.getServings()), 2, java.math.RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;
            res.branchId    = r.getBranch() != null ? r.getBranch().getId() : null;
            res.branchName  = r.getBranch() != null ? r.getBranch().getName() : "HQ";
            res.createdBy   = r.getCreatedBy() != null ? r.getCreatedBy().getUsername() : null;
            res.createdAt   = r.getCreatedAt() != null ? r.getCreatedAt().toString() : null;
            res.updatedAt   = r.getUpdatedAt() != null ? r.getUpdatedAt().toString() : null;

            res.ingredients = r.getIngredients().stream()
                    .map(IngredientResponse::from)
                    .collect(Collectors.toList());

            // Include steps ordered by stepNumber
            res.steps = r.getSteps() != null
                    ? r.getSteps().stream()
                    .sorted(java.util.Comparator.comparing(RecipeStep::getStepNumber))
                    .map(StepResponse::from)
                    .collect(Collectors.toList())
                    : new ArrayList<>();

            return res;
        }
    }

    // ── Ingredient response ───────────────────────────────────────────────────
    @Data
    public static class IngredientResponse {
        private Long       id;
        private Long       ingredientId;
        private String     ingredientName;
        private String     category;
        private Double     quantity;
        private String     unit;
        private BigDecimal unitCost;
        private BigDecimal lineCost;
        private String     notes;

        public static IngredientResponse from(RecipeIngredient ri) {
            IngredientResponse r = new IngredientResponse();
            r.id             = ri.getId();
            r.ingredientId   = ri.getIngredient().getId();
            r.ingredientName = ri.getIngredient().getName();
            r.category       = ri.getIngredient().getCategory();
            r.quantity       = ri.getQuantity();
            r.unit           = ri.getUnit() != null ? ri.getUnit() : ri.getIngredient().getUnit();
            r.unitCost       = ri.getIngredient().getCostPerUnit();
            r.lineCost       = ri.getIngredient().getCostPerUnit()
                    .multiply(BigDecimal.valueOf(ri.getQuantity()))
                    .setScale(2, java.math.RoundingMode.HALF_UP);
            r.notes          = ri.getNotes();
            return r;
        }
    }

    // ── Step response ─────────────────────────────────────────────────────────
    @Data
    public static class StepResponse {
        private Long    id;
        private Integer stepNumber;
        private String  title;
        private String  instruction;
        private Integer durationMinutes;

        public static StepResponse from(RecipeStep s) {
            StepResponse r = new StepResponse();
            r.id              = s.getId();
            r.stepNumber      = s.getStepNumber();
            r.title           = s.getTitle();
            r.instruction     = s.getInstruction();
            r.durationMinutes = s.getDurationMinutes();
            return r;
        }
    }

    // ── Cost breakdown response ───────────────────────────────────────────────
    @Data
    public static class CostBreakdown {
        private Long                     recipeId;
        private String                   recipeName;
        private Integer                  servings;
        private BigDecimal               totalCost;
        private BigDecimal               costPerServing;
        private List<IngredientResponse> ingredients;

        public static CostBreakdown from(Recipe r, int servings, BigDecimal totalCost) {
            CostBreakdown cb = new CostBreakdown();
            cb.recipeId      = r.getId();
            cb.recipeName    = r.getName();
            cb.servings      = servings;
            cb.totalCost     = totalCost;
            cb.costPerServing = servings > 0
                    ? totalCost.divide(BigDecimal.valueOf(servings), 2, java.math.RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;
            cb.ingredients   = r.getIngredients().stream()
                    .map(IngredientResponse::from)
                    .collect(Collectors.toList());
            return cb;
        }
    }
}