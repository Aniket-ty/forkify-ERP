package com.fooderp.repository;

import com.fooderp.entity.InventoryItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface InventoryItemRepository extends JpaRepository<InventoryItem, Long> {

    List<InventoryItem> findByBranchIdOrderByIngredientNameAsc(Long branchId);

    Optional<InventoryItem> findByIngredientIdAndBranchId(Long ingredientId, Long branchId);

    // ── FIX: Only flag as low stock when minStockLevel > 0 (i.e. user has configured it)
    // Previously: WHERE currentQuantity < minStockLevel
    // Bug: minStockLevel = 0 meant items with any stock still showed as low
    // if code elsewhere evaluated the 1.2x warning threshold.
    // Now: minStockLevel must be > 0 AND quantity must be below it.
    @Query("SELECT i FROM InventoryItem i WHERE i.branch.id = :branchId " +
            "AND i.minStockLevel > 0 " +
            "AND i.currentQuantity < i.minStockLevel " +
            "ORDER BY i.currentQuantity ASC")
    List<InventoryItem> findLowStockByBranch(@Param("branchId") Long branchId);

    // Items expiring within N days
    @Query("SELECT i FROM InventoryItem i WHERE i.branch.id = :branchId " +
            "AND i.expiryDate IS NOT NULL AND i.expiryDate <= :cutoff ORDER BY i.expiryDate ASC")
    List<InventoryItem> findExpiringByBranch(@Param("branchId") Long branchId,
                                             @Param("cutoff") java.time.LocalDate cutoff);

    // ── FIX: Same fix for count — don't count items where minStockLevel = 0
    @Query("SELECT COUNT(i) FROM InventoryItem i WHERE i.branch.id = :branchId " +
            "AND i.minStockLevel > 0 " +
            "AND i.currentQuantity < i.minStockLevel")
    long countLowStockByBranch(@Param("branchId") Long branchId);

    @Query("SELECT SUM(i.currentQuantity * " +
            "CASE WHEN i.unitCost IS NOT NULL THEN i.unitCost ELSE i.ingredient.costPerUnit END) " +
            "FROM InventoryItem i WHERE i.branch.id = :branchId")
    java.math.BigDecimal sumTotalValueByBranch(@Param("branchId") Long branchId);
}