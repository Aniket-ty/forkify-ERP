package com.fooderp.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Positive;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "sales_entries")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SalesEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "recipe_id", nullable = false)
    private Recipe recipe;

    // Optional link to a menu item (for price lookup)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "menu_item_id")
    private MenuItem menuItem;

    // Optional customer link — when a walk-in customer is identified
    // Null = anonymous / walk-in without account
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private Customer customer;

    @Column(name = "sale_date", nullable = false)
    private LocalDate saleDate;

    @Positive(message = "Quantity sold must be positive")
    @Column(name = "quantity_sold", nullable = false)
    private Integer quantitySold;

    @Column(name = "selling_price", precision = 10, scale = 2)
    private BigDecimal sellingPrice = BigDecimal.ZERO;

    @Column(name = "total_revenue", precision = 12, scale = 2)
    private BigDecimal totalRevenue = BigDecimal.ZERO;

    @Column(name = "cost_of_goods", precision = 10, scale = 2)
    private BigDecimal costOfGoods = BigDecimal.ZERO;

    // Loyalty points awarded for this sale
    @Column(name = "loyalty_points_awarded")
    private Integer loyaltyPointsAwarded = 0;

    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "logged_by")
    private User loggedBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (saleDate == null) saleDate = LocalDate.now();
        if (sellingPrice != null && quantitySold != null) {
            totalRevenue = sellingPrice.multiply(BigDecimal.valueOf(quantitySold));
        }
    }
}