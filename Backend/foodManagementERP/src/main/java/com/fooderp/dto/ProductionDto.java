package com.fooderp.dto;

import com.fooderp.entity.ProductionLog;
import com.fooderp.entity.RecipeIngredient;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

public class ProductionDto {

    // ── Log Production request ────────────────────────────────────────────────
    @Data
    public static class Request {
        @NotNull(message = "Recipe ID is required")
        private Long recipeId;

        @Positive(message = "Servings must be positive")
        private Integer servingsProduced;

        private String notes;
    }

    // ── Stock deduction preview (shown before confirming production) ──────────
    @Data
    public static class DeductionPreview {
        private Long   recipeId;
        private String recipeName;
        private Integer servingsProduced;
        private Integer baseServings;
        private BigDecimal estimatedCost;
        private List<IngredientDeduction> deductions;
        private List<String> insufficientItems; // ingredient names with insufficient stock

        @Data
        public static class IngredientDeduction {
            private Long   ingredientId;
            private String ingredientName;
            private String unit;
            private Double requiredQty;
            private Double availableQty;
            private boolean sufficient;
            private BigDecimal unitCost;
            private BigDecimal lineCost;
        }
    }

    // ── Production log response ───────────────────────────────────────────────
    @Data
    public static class Response {
        private Long   id;
        private Long   recipeId;
        private String recipeName;
        private String recipeCategory;
        private Integer servingsProduced;
        private Integer baseServings;
        private BigDecimal totalCost;
        private BigDecimal costPerServing;
        private String notes;
        private String productionDate;
        private String loggedBy;
        private String createdAt;
        private List<String> deductedIngredients;

        public static Response from(ProductionLog log) {
            Response r = new Response();
            r.id               = log.getId();
            r.recipeId         = log.getRecipe().getId();
            r.recipeName       = log.getRecipe().getName();
            r.recipeCategory   = log.getRecipe().getCategory();
            r.servingsProduced = log.getServingsProduced();
            r.baseServings     = log.getRecipe().getServings();
            r.totalCost        = log.getTotalCost();
            r.costPerServing   = log.getCostPerServing();
            r.notes            = log.getNotes();
            r.productionDate   = log.getProductionDate() != null ? log.getProductionDate().toString() : null;
            r.loggedBy         = log.getLoggedBy() != null ? log.getLoggedBy().getUsername() : null;
            r.createdAt        = log.getCreatedAt() != null ? log.getCreatedAt().toString() : null;
            r.deductedIngredients = log.getRecipe().getIngredients().stream()
                    .map(ri -> ri.getIngredient().getName())
                    .collect(Collectors.toList());
            return r;
        }
    }
}
