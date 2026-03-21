package com.fooderp.repository;

import com.fooderp.entity.ProductionLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface ProductionLogRepository extends JpaRepository<ProductionLog, Long> {

    List<ProductionLog> findByBranchIdOrderByCreatedAtDesc(Long branchId);

    List<ProductionLog> findByBranchIdAndProductionDateOrderByCreatedAtDesc(
            Long branchId, LocalDate date);

    List<ProductionLog> findByBranchIdAndRecipeIdOrderByCreatedAtDesc(
            Long branchId, Long recipeId);

    @Query("SELECT p FROM ProductionLog p WHERE p.branch.id = :branchId " +
            "AND p.productionDate BETWEEN :from AND :to ORDER BY p.productionDate DESC")
    List<ProductionLog> findByBranchAndDateRange(
            @Param("branchId") Long branchId,
            @Param("from")     LocalDate from,
            @Param("to")       LocalDate to);

    @Query("SELECT COUNT(p) FROM ProductionLog p WHERE p.branch.id = :branchId " +
            "AND p.productionDate = :date")
    long countByBranchAndDate(@Param("branchId") Long branchId, @Param("date") LocalDate date);

    @Query("SELECT SUM(p.totalCost) FROM ProductionLog p WHERE p.branch.id = :branchId " +
            "AND p.productionDate BETWEEN :from AND :to")
    java.math.BigDecimal sumTotalCostByBranchAndDateRange(
            @Param("branchId") Long branchId,
            @Param("from")     LocalDate from,
            @Param("to")       LocalDate to);
}
