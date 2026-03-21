package com.fooderp.repository;

import com.fooderp.entity.SalesEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface SalesEntryRepository extends JpaRepository<SalesEntry, Long> {

    List<SalesEntry> findByBranchIdOrderBySaleDateDescCreatedAtDesc(Long branchId);

    List<SalesEntry> findByBranchIdAndSaleDateOrderByCreatedAtDesc(Long branchId, LocalDate date);

    // ← NEW: all sales for a customer (for purchase history in CRM)
    List<SalesEntry> findByCustomerIdOrderBySaleDateDesc(Long customerId);

    @Query("SELECT s FROM SalesEntry s WHERE s.branch.id = :branchId " +
            "AND s.saleDate BETWEEN :from AND :to ORDER BY s.saleDate DESC")
    List<SalesEntry> findByBranchAndDateRange(
            @Param("branchId") Long branchId,
            @Param("from")     LocalDate from,
            @Param("to")       LocalDate to);

    @Query("SELECT COALESCE(SUM(s.totalRevenue), 0) FROM SalesEntry s " +
            "WHERE s.branch.id = :branchId AND s.saleDate BETWEEN :from AND :to")
    BigDecimal sumRevenueByBranchAndDateRange(
            @Param("branchId") Long branchId,
            @Param("from")     LocalDate from,
            @Param("to")       LocalDate to);

    @Query("SELECT s.recipe.id, s.recipe.name, SUM(s.quantitySold), SUM(s.totalRevenue) " +
            "FROM SalesEntry s WHERE s.branch.id = :branchId " +
            "AND s.saleDate BETWEEN :from AND :to " +
            "GROUP BY s.recipe.id, s.recipe.name ORDER BY SUM(s.quantitySold) DESC")
    List<Object[]> findTopRecipesByBranchAndDateRange(
            @Param("branchId") Long branchId,
            @Param("from")     LocalDate from,
            @Param("to")       LocalDate to);

    @Query("SELECT s.branch.id, s.branch.name, COALESCE(SUM(s.totalRevenue), 0) " +
            "FROM SalesEntry s WHERE s.saleDate BETWEEN :from AND :to " +
            "GROUP BY s.branch.id, s.branch.name ORDER BY SUM(s.totalRevenue) DESC")
    List<Object[]> findRevenueByBranch(
            @Param("from") LocalDate from,
            @Param("to")   LocalDate to);

    @Query("SELECT COUNT(s) FROM SalesEntry s WHERE s.branch.id = :branchId " +
            "AND s.saleDate = :date")
    long countByBranchAndDate(@Param("branchId") Long branchId, @Param("date") LocalDate date);
}