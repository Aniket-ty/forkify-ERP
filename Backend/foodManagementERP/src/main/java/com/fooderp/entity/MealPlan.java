package com.fooderp.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "meal_plans")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MealPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "plan_name", nullable = false)
    private String planName;

    @Column(name = "week_number", nullable = false)
    private Integer weekNumber;

    @Column(name = "year", nullable = false)
    private Integer year;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MealPlanStatus status = MealPlanStatus.DRAFT;

    // null = HQ template (not yet pushed to any branch)
    // non-null = this plan is assigned to a specific branch
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id")
    private Branch branch;

    // References back to the HQ template this was pushed from
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_plan_id")
    private MealPlan sourcePlan;

    @Column(name = "created_by_hq")
    private boolean createdByHQ = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @OneToMany(mappedBy = "mealPlan", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MealPlanItem> items = new ArrayList<>();

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

    public enum MealPlanStatus {
        DRAFT,      // being built
        ACTIVE,     // in use
        PUSHED,     // HQ pushed to branches
        ARCHIVED
    }
}
