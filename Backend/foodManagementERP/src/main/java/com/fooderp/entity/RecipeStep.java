package com.fooderp.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "recipe_steps")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RecipeStep {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipe_id", nullable = false)
    private Recipe recipe;

    // Step order: 1, 2, 3 ...
    @Column(name = "step_number", nullable = false)
    private Integer stepNumber;

    // Short title e.g. "Marinate chicken"
    @Column(length = 200)
    private String title;

    // Full instruction text
    @Column(columnDefinition = "TEXT", nullable = false)
    private String instruction;

    // Optional: how many minutes this step takes
    @Column(name = "duration_minutes")
    private Integer durationMinutes;
}