package com.fooderp.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "suppliers")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Supplier {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Supplier name is required")
    @Column(nullable = false)
    private String name;

    private String contactPerson;
    private String phone;
    private String email;
    private String address;
    private String category; // Produce, Dairy, Meat, Grains, Spices, etc.
    private String paymentTerms; // Net 15, Net 30, COD

    // Rating out of 5, updated per GRN
    @Column(precision = 3, scale = 2)
    private BigDecimal rating = BigDecimal.valueOf(0);

    private Integer totalOrders = 0;

    // HQ-approved suppliers are visible to all branches
    // Branch-specific suppliers are visible only to that branch
    @Column(name = "hq_approved")
    private boolean hqApproved = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id")
    private Branch branch; // null = global/HQ supplier

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SupplierStatus status = SupplierStatus.ACTIVE;

    private String notes;

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

    public enum SupplierStatus {
        ACTIVE, INACTIVE, BLACKLISTED
    }
}
