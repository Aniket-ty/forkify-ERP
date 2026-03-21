package com.fooderp.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "stock_transactions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StockTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "ingredient_id", nullable = false)
    private Ingredient ingredient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionType type;

    @Column(nullable = false)
    private Double quantity;

    @Column(name = "unit_cost", precision = 10, scale = 2)
    private BigDecimal unitCost;

    // Running balance after this transaction
    @Column(name = "balance_after")
    private Double balanceAfter;

    // PO number, batch number, wastage reference etc.
    @Column(name = "reference_no")
    private String referenceNo;

    private String notes;

    // Supplier for STOCK_IN transactions
    private String supplier;

    // Expiry date for the batch being received
    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Column(name = "transaction_date")
    private LocalDate transactionDate;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (transactionDate == null) transactionDate = LocalDate.now();
    }

    public enum TransactionType {
        STOCK_IN,       // goods received from supplier
        STOCK_OUT,      // consumed in production (from Phase 4)
        WASTAGE,        // spoiled / expired / damaged
        ADJUSTMENT,     // manual correction by manager
        TRANSFER_IN,    // received from another branch
        TRANSFER_OUT    // sent to another branch
    }
}