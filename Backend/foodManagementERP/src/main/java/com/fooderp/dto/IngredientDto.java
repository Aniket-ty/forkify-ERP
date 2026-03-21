package com.fooderp.dto;

import com.fooderp.entity.Ingredient;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;
import java.math.BigDecimal;
import java.util.Arrays;
import java.util.ArrayList;
import java.util.List;

public class IngredientDto {

    @Data
    public static class Request {
        @NotBlank(message = "Name is required")
        private String name;

        @NotBlank(message = "Unit is required")
        private String unit;

        @NotBlank(message = "Category is required")
        private String category;

        @PositiveOrZero
        private BigDecimal costPerUnit = BigDecimal.ZERO;

        private Double caloriesPerUnit = 0.0;
        private Double proteinPerUnit  = 0.0;
        private Double carbsPerUnit    = 0.0;
        private Double fatPerUnit      = 0.0;
        private Double fiberPerUnit    = 0.0;
        private String allergens;
    }

    @Data
    public static class Response {
        private Long   id;
        private String name;
        private String unit;
        private String category;
        private BigDecimal costPerUnit;
        private Double caloriesPerUnit;
        private Double proteinPerUnit;
        private Double carbsPerUnit;
        private Double fatPerUnit;
        private Double fiberPerUnit;
        private List<String> allergens;
        private boolean active;

        public static Response from(Ingredient i) {
            Response r = new Response();
            r.id             = i.getId();
            r.name           = i.getName();
            r.unit           = i.getUnit();
            r.category       = i.getCategory();
            r.costPerUnit    = i.getCostPerUnit();
            r.caloriesPerUnit = i.getCaloriesPerUnit();
            r.proteinPerUnit  = i.getProteinPerUnit();
            r.carbsPerUnit    = i.getCarbsPerUnit();
            r.fatPerUnit      = i.getFatPerUnit();
            r.fiberPerUnit    = i.getFiberPerUnit();
            r.allergens       = i.getAllergens() != null
                    ? Arrays.asList(i.getAllergens().split(","))
                    : new ArrayList<>();
            r.active = i.isActive();
            return r;
        }
    }
}