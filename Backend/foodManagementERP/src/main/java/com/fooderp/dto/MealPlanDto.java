package com.fooderp.dto;

import com.fooderp.entity.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;
import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

public class MealPlanDto {

    // ── Create / Update request ───────────────────────────────────────────────
    @Data
    public static class Request {
        @NotBlank(message = "Plan name is required")
        private String planName;

        @NotNull(message = "Week number is required")
        private Integer weekNumber;

        @NotNull(message = "Year is required")
        private Integer year;

        private String status = "DRAFT";
        private List<ItemRequest> items = new ArrayList<>();
    }

    @Data
    public static class ItemRequest {
        @NotNull
        private Long recipeId;
        @NotNull
        private Integer day;           // 1–7
        @NotNull
        private String mealType;       // BREAKFAST/LUNCH/DINNER/SNACK
        @Positive
        private Integer expectedCovers = 1;
        private String displayName;
        private String notes;
    }

    // ── Full response ─────────────────────────────────────────────────────────
    @Data
    public static class Response {
        private Long   id;
        private String planName;
        private Integer weekNumber;
        private Integer year;
        private String status;
        private Long   branchId;
        private String branchName;
        private boolean createdByHQ;
        private String createdBy;
        private List<ItemResponse> items;
        private String createdAt;
        private String updatedAt;

        public static Response from(MealPlan p) {
            Response r = new Response();
            r.id          = p.getId();
            r.planName    = p.getPlanName();
            r.weekNumber  = p.getWeekNumber();
            r.year        = p.getYear();
            r.status      = p.getStatus().name();
            r.branchId    = p.getBranch() != null ? p.getBranch().getId()   : null;
            r.branchName  = p.getBranch() != null ? p.getBranch().getName() : "HQ Template";
            r.createdByHQ = p.isCreatedByHQ();
            r.createdBy   = p.getCreatedBy() != null ? p.getCreatedBy().getUsername() : null;
            r.items       = p.getItems().stream().map(ItemResponse::from).collect(Collectors.toList());
            r.createdAt   = p.getCreatedAt() != null ? p.getCreatedAt().toString() : null;
            r.updatedAt   = p.getUpdatedAt() != null ? p.getUpdatedAt().toString() : null;
            return r;
        }
    }

    @Data
    public static class ItemResponse {
        private Long   id;
        private Long   recipeId;
        private String recipeName;
        private String recipeCategory;
        private Integer day;
        private String mealType;
        private Integer expectedCovers;
        private String displayName;
        private String notes;
        private BigDecimal estimatedCost;

        public static ItemResponse from(MealPlanItem i) {
            ItemResponse r = new ItemResponse();
            r.id             = i.getId();
            r.recipeId       = i.getRecipe().getId();
            r.recipeName     = i.getRecipe().getName();
            r.recipeCategory = i.getRecipe().getCategory();
            r.day            = i.getDay();
            r.mealType       = i.getMealType().name();
            r.expectedCovers = i.getExpectedCovers();
            r.displayName    = i.getDisplayName() != null ? i.getDisplayName() : i.getRecipe().getName();
            r.notes          = i.getNotes();
            return r;
        }
    }

    // ── Ingredient forecast response ──────────────────────────────────────────
    @Data
    public static class ForecastResponse {
        private Long   mealPlanId;
        private String planName;
        private Integer weekNumber;
        private Integer year;
        private List<ForecastItem> ingredients;
        private List<ShortageItem> shortages;
        private BigDecimal totalEstimatedCost;

        @Data
        public static class ForecastItem {
            private Long   ingredientId;
            private String ingredientName;
            private String unit;
            private String category;
            private Double requiredQuantity;
            private Double currentStock;
            private Double shortfallQuantity; // 0 if sufficient
            private boolean sufficient;
            private BigDecimal unitCost;
            private BigDecimal totalCost;
        }

        @Data
        public static class ShortageItem {
            private Long   ingredientId;
            private String ingredientName;
            private String unit;
            private Double required;
            private Double available;
            private Double shortfall;
        }
    }
}
