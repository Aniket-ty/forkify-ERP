package com.fooderp.repository;

import com.fooderp.entity.Recipe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface RecipeRepository extends JpaRepository<Recipe, Long> {

    @Query("SELECT r FROM Recipe r WHERE r.branch IS NULL OR r.branch.id = :branchId ORDER BY r.hqOwned DESC, r.createdAt DESC")
    List<Recipe> findVisibleToBranch(@Param("branchId") Long branchId);

    List<Recipe> findAllByOrderByCreatedAtDesc();

    List<Recipe> findByStatusOrderByNameAsc(Recipe.RecipeStatus status);

    @Query("SELECT r FROM Recipe r WHERE (r.branch IS NULL OR r.branch.id = :branchId) AND LOWER(r.name) LIKE LOWER(CONCAT('%', :q, '%')) ORDER BY r.name ASC")
    List<Recipe> searchByNameForBranch(@Param("branchId") Long branchId, @Param("q") String query);

    @Query("SELECT r FROM Recipe r WHERE LOWER(r.name) LIKE LOWER(CONCAT('%', :q, '%')) ORDER BY r.name ASC")
    List<Recipe> searchByName(@Param("q") String query);

    @Query("SELECT DISTINCT r.category FROM Recipe r ORDER BY r.category")
    List<String> findDistinctCategories();

    // Count active recipes (admin)
    long countByStatus(Recipe.RecipeStatus status);

    // Count active recipes visible to branch
    @Query("""
        SELECT COUNT(r)
        FROM Recipe r
        WHERE r.status = 'ACTIVE'
        AND (r.branch.id = :branchId OR r.branch IS NULL)
    """)
    long countActiveVisibleToBranch(Long branchId);
}