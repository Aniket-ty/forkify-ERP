package com.fooderp.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Positive;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "recipe_ingredients")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RecipeIngredient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipe_id", nullable = false)
    private Recipe recipe;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "ingredient_id", nullable = false)
    private Ingredient ingredient;

    // Quantity for the recipe's BASE servings (e.g. 200 grams for 4 servings)
    @Positive(message = "Quantity must be positive")
    @Column(nullable = false)
    private Double quantity;

    // Optional override unit — if blank, uses ingredient's default unit
    private String unit;

    // Optional preparation note e.g. "finely chopped", "room temperature"
    private String notes;
}