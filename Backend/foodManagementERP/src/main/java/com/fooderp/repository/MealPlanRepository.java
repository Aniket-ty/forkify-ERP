package com.fooderp.repository;

import com.fooderp.entity.MealPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface MealPlanRepository extends JpaRepository<MealPlan, Long> {

    // HQ templates (no branch)
    List<MealPlan> findByBranchIsNullOrderByYearDescWeekNumberDesc();

    // Branch-specific plans
    List<MealPlan> findByBranchIdOrderByYearDescWeekNumberDesc(Long branchId);

    // Specific week for a branch
    Optional<MealPlan> findByBranchIdAndWeekNumberAndYear(Long branchId, int week, int year);

    // Plans pushed from a specific HQ template
    List<MealPlan> findBySourcePlanId(Long sourcePlanId);

    @Query("SELECT p FROM MealPlan p WHERE (p.branch IS NULL OR p.branch.id = :branchId) " +
            "AND p.weekNumber = :week AND p.year = :year ORDER BY p.branch.id NULLS FIRST")
    List<MealPlan> findVisibleToWeek(
            @Param("branchId") Long branchId,
            @Param("week")     int week,
            @Param("year")     int year);
}
