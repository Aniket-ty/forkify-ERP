package com.fooderp.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "ingredients")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Ingredient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Ingredient name is required")
    @Column(nullable = false)
    private String name;

    // kg, ltr, pcs, g, ml, tbsp, tsp, cup, dozen
    @NotBlank(message = "Unit is required")
    @Column(nullable = false)
    private String unit;

    @Column(nullable = false)
    private String category; // Vegetables, Dairy, Meat, Grains, Spices, Oils etc.

    // Live cost per unit — updated when stock prices change
    @PositiveOrZero
    @Column(name = "cost_per_unit", precision = 10, scale = 2)
    private BigDecimal costPerUnit = BigDecimal.ZERO;

    // Calories per unit (for nutrition calculation)
    @Column(name = "calories_per_unit")
    private Double caloriesPerUnit = 0.0;

    @Column(name = "protein_per_unit")
    private Double proteinPerUnit = 0.0;

    @Column(name = "carbs_per_unit")
    private Double carbsPerUnit = 0.0;

    @Column(name = "fat_per_unit")
    private Double fatPerUnit = 0.0;

    @Column(name = "fiber_per_unit")
    private Double fiberPerUnit = 0.0;

    // Comma-separated allergens e.g. "Gluten,Dairy"
    private String allergens;

    private boolean active = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}