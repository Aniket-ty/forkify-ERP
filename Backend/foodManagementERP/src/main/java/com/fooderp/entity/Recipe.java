package com.fooderp.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "recipes")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Recipe {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Recipe name is required")
    @Column(nullable = false)
    private String name;

    @Column(length = 1000)
    private String description;

    @Column(nullable = false)
    private String category; // Italian, Indian, Seafood, Fast Food, Dessert etc.

    @Positive(message = "Servings must be positive")
    @Column(nullable = false)
    private Integer servings = 1;

    @Column(name = "prep_time")
    private Integer prepTime = 0; // minutes

    @Column(name = "cook_time")
    private Integer cookTime = 0; // minutes

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RecipeStatus status = RecipeStatus.DRAFT;

    // HQ-owned recipes are read-only for branch managers
    @Column(name = "is_hq_owned")
    private boolean hqOwned = false;

    // Comma-separated tags e.g. "Vegetarian,Spicy,Gluten-Free"
    private String tags;

    // Nutrition per BASE serving (servings field above)
    private Double calories  = 0.0;
    private Double protein   = 0.0;
    private Double carbs     = 0.0;
    private Double fat       = 0.0;
    private Double fiber     = 0.0;

    // Comma-separated allergens e.g. "Gluten,Dairy"
    private String allergens;

    @Column(name = "image_url")
    private String imageUrl;

    // The branch that owns this recipe (null = global / HQ recipe)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id")
    private Branch branch;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    // Ingredients list — cascade so adding/removing via Recipe is easy
    @OneToMany(mappedBy = "recipe", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RecipeIngredient> ingredients = new ArrayList<>();

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

    public enum RecipeStatus {
        DRAFT, ACTIVE, ARCHIVED
    }
}