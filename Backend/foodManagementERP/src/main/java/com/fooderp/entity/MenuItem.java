package com.fooderp.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;

@Entity
@Table(name = "menu_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MenuItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "menu_id", nullable = false)
    private Menu menu;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "recipe_id", nullable = false)
    private Recipe recipe;

    // Override display name (if different from recipe name)
    @Column(name = "display_name")
    private String displayName;

    // Default selling price for this item (branch can override via BranchMenuPrice)
    @Column(name = "base_price", precision = 10, scale = 2)
    private BigDecimal basePrice = BigDecimal.ZERO;

    // Category on the menu e.g. Starters, Mains, Desserts
    @Column(name = "menu_category")
    private String menuCategory;

    private String description;

    @Column(name = "is_available")
    private boolean available = true;

    @Column(name = "sort_order")
    private Integer sortOrder = 0;
}
