package com.fooderp.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Represents the "frozen" stock of a finished / prepared dish.
 *
 * Flow:
 *  1. Log Production → servingsProduced added to this table  (STOCK_IN type)
 *  2. Daily Sales    → servingsSold    deducted from this table (STOCK_OUT type)
 *  3. Wastage (finished product) → servings deducted (WASTAGE type)
 *
 * availableServings = produced - sold - wasted
 */
@Entity
@Table(name = "finished_good_stock")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FinishedGoodStock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "recipe_id", nullable = false)
    private Recipe recipe;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    // Running balance of available servings
    @Column(name = "available_servings", nullable = false)
    private Integer availableServings = 0;

    // Total produced (cumulative)
    @Column(name = "total_produced")
    private Integer totalProduced = 0;

    // Total sold (cumulative)
    @Column(name = "total_sold")
    private Integer totalSold = 0;

    // Total wasted (cumulative)
    @Column(name = "total_wasted")
    private Integer totalWasted = 0;

    // Cost per serving (from last production run)
    @Column(name = "cost_per_serving", precision = 10, scale = 2)
    private BigDecimal costPerServing;

    @Column(name = "last_produced_date")
    private LocalDate lastProducedDate;

    @Column(name = "last_updated")
    private LocalDateTime lastUpdated;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt   = LocalDateTime.now();
        lastUpdated = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        lastUpdated = LocalDateTime.now();
    }
}