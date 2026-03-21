package com.fooderp.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "branch_menu_prices",
        uniqueConstraints = @UniqueConstraint(columnNames = {"menu_item_id", "branch_id"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BranchMenuPrice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "menu_item_id", nullable = false)
    private MenuItem menuItem;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    // Branch-specific price override — null means use menuItem.basePrice
    @Column(name = "custom_price", precision = 10, scale = 2)
    private BigDecimal customPrice;

    @Column(name = "is_available")
    private boolean available = true;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
