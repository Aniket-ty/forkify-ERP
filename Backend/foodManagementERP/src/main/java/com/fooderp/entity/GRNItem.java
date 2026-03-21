package com.fooderp.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "grn_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class GRNItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "grn_id", nullable = false)
    private GoodsReceived grn;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "ingredient_id", nullable = false)
    private Ingredient ingredient;

    // Ordered quantity (from PO)
    @Column(name = "ordered_quantity")
    private Double orderedQuantity;

    // Actually received quantity
    @Column(name = "received_quantity", nullable = false)
    private Double receivedQuantity;

    @Column(name = "unit_price", precision = 10, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    private String notes;
}
