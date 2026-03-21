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
@Table(name = "production_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductionLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "recipe_id", nullable = false)
    private Recipe recipe;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    @Positive(message = "Servings produced must be positive")
    @Column(name = "servings_produced", nullable = false)
    private Integer servingsProduced;

    // Total ingredient cost at time of production
    @Column(name = "total_cost", precision = 10, scale = 2)
    private BigDecimal totalCost;

    @Column(name = "cost_per_serving", precision = 10, scale = 2)
    private BigDecimal costPerServing;

    private String notes;

    @Column(name = "production_date")
    private LocalDate productionDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "logged_by")
    private User loggedBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (productionDate == null) productionDate = LocalDate.now();
    }
}
