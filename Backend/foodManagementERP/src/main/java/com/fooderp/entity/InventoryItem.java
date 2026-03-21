package com.fooderp.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "inventory_items",
        uniqueConstraints = @UniqueConstraint(columnNames = {"ingredient_id", "branch_id"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
public class InventoryItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "ingredient_id", nullable = false)
    private Ingredient ingredient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    @PositiveOrZero
    @Column(nullable = false)
    private Double currentQuantity = 0.0;

    // Minimum stock level — below this = LOW alert
    // When 0 (not set), no low-stock alert is triggered
    @PositiveOrZero
    @Column(nullable = false)
    private Double minStockLevel = 0.0;

    private String location;

    @Column(name = "unit_cost", precision = 10, scale = 2)
    private BigDecimal unitCost;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

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

    public BigDecimal getEffectiveUnitCost() {
        return unitCost != null ? unitCost : ingredient.getCostPerUnit();
    }

    public BigDecimal getTotalValue() {
        return getEffectiveUnitCost()
                .multiply(BigDecimal.valueOf(currentQuantity))
                .setScale(2, java.math.RoundingMode.HALF_UP);
    }

    /**
     * FIX: When minStockLevel = 0 (not configured), NEVER show LOW/WARNING/CRITICAL.
     * Previously this caused items to show WARNING after stock-in because
     * currentQty < 0 * 1.2 (= 0) was evaluated — which is never true,
     * BUT the real bug was minStockLevel being set too high vs stock added.
     *
     * Key rule: minStockLevel = 0 means "not configured" → always GOOD if qty > 0.
     */
    public StockStatus getStockStatus() {
        if (currentQuantity <= 0)   return StockStatus.OUT_OF_STOCK;
        if (minStockLevel <= 0)     return StockStatus.GOOD;   // ← KEY FIX

        if (currentQuantity < minStockLevel * 0.3) return StockStatus.CRITICAL;
        if (currentQuantity < minStockLevel)       return StockStatus.LOW;
        if (currentQuantity < minStockLevel * 1.2) return StockStatus.WARNING;
        return StockStatus.GOOD;
    }

    public enum StockStatus {
        GOOD, WARNING, LOW, CRITICAL, OUT_OF_STOCK
    }
}