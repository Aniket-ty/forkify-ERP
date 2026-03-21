package com.fooderp.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "wastage_records")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WastageRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ── What was wasted: EITHER ingredient OR finished product ──────────────
    @Enumerated(EnumType.STRING)
    @Column(name = "wastage_type", nullable = false)
    private WastageType wastageType = WastageType.INGREDIENT;

    // Set when wastageType = INGREDIENT
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "ingredient_id")
    private Ingredient ingredient;

    // Set when wastageType = FINISHED_PRODUCT
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "recipe_id")
    private Recipe recipe;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    @Column(nullable = false)
    private Double quantity; // units for ingredient, servings for finished product

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private WastageReason reason;

    @Column(name = "cost_loss", precision = 10, scale = 2)
    private BigDecimal costLoss;

    @Column(name = "reference_no")
    private String referenceNo;

    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private WastageStatus status = WastageStatus.PENDING;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "logged_by")
    private User loggedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by")
    private User approvedBy;

    @Column(name = "wastage_date")
    private LocalDate wastageDate;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt  = LocalDateTime.now();
        if (wastageDate == null) wastageDate = LocalDate.now();
    }

    public enum WastageType {
        INGREDIENT,       // raw material wastage
        FINISHED_PRODUCT  // cooked/prepared dish wastage
    }

    public enum WastageReason {
        EXPIRED, DAMAGED, SPOILED, OVERPRODUCTION, QUALITY_ISSUE, OTHER
    }

    public enum WastageStatus {
        PENDING,   // logged, awaiting manager approval
        APPROVED,  // approved — inventory / finished stock deducted
        REJECTED   // rejected — no stock change
    }
}