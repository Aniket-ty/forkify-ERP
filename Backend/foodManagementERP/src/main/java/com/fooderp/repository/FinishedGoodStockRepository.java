package com.fooderp.repository;

import com.fooderp.entity.FinishedGoodStock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface FinishedGoodStockRepository extends JpaRepository<FinishedGoodStock, Long> {

    Optional<FinishedGoodStock> findByRecipeIdAndBranchId(Long recipeId, Long branchId);

    List<FinishedGoodStock> findByBranchIdOrderByRecipeNameAsc(Long branchId);

    @Query("SELECT f FROM FinishedGoodStock f WHERE f.branch.id = :branchId AND f.availableServings > 0 ORDER BY f.recipe.name ASC")
    List<FinishedGoodStock> findAvailableByBranch(@Param("branchId") Long branchId);
}