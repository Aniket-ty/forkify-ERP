package com.fooderp.repository;

import com.fooderp.entity.StockTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface StockTransactionRepository extends JpaRepository<StockTransaction, Long> {

    List<StockTransaction> findByBranchIdOrderByCreatedAtDesc(Long branchId);

    List<StockTransaction> findByBranchIdAndTypeOrderByCreatedAtDesc(
            Long branchId, StockTransaction.TransactionType type);

    List<StockTransaction> findByBranchIdAndIngredientIdOrderByCreatedAtDesc(
            Long branchId, Long ingredientId);

    @Query("SELECT t FROM StockTransaction t WHERE t.branch.id = :branchId " +
            "AND t.transactionDate BETWEEN :from AND :to ORDER BY t.createdAt DESC")
    List<StockTransaction> findByBranchAndDateRange(
            @Param("branchId") Long branchId,
            @Param("from")     LocalDate from,
            @Param("to")       LocalDate to);
}