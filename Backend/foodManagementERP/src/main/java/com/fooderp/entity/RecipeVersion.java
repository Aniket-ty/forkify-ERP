package com.fooderp.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "recipe_versions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RecipeVersion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipe_id", nullable = false)
    private Recipe recipe;

    @Column(nullable = false)
    private Integer version; // 1, 2, 3 ...

    // Full JSON snapshot of the recipe at this version
    @Column(name = "snapshot_json", columnDefinition = "TEXT", nullable = false)
    private String snapshotJson;

    // Cost at the time of this version
    @Column(name = "cost_per_serving", precision = 10, scale = 2)
    private BigDecimal costPerServing;

    @Column(name = "change_summary", length = 500)
    private String changeSummary; // e.g. "Reduced chicken from 200g to 180g"

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}