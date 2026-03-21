package com.fooderp.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Positive;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "meal_plan_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MealPlanItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "meal_plan_id", nullable = false)
    private MealPlan mealPlan;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "recipe_id", nullable = false)
    private Recipe recipe;

    // 1=Monday, 2=Tuesday, ... 7=Sunday
    @Column(nullable = false)
    private Integer day;

    // BREAKFAST, LUNCH, DINNER, SNACK
    @Enumerated(EnumType.STRING)
    @Column(name = "meal_type", nullable = false)
    private MealType mealType;

    // Expected number of customers for this slot
    @Positive(message = "Expected covers must be positive")
    @Column(name = "expected_covers", nullable = false)
    private Integer expectedCovers = 1;

    // Optional display name override
    @Column(name = "display_name")
    private String displayName;

    private String notes;

    public enum MealType {
        BREAKFAST, LUNCH, DINNER, SNACK
    }
}
