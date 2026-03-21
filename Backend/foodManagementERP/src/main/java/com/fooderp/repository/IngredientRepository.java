package com.fooderp.repository;

import com.fooderp.entity.Ingredient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface IngredientRepository extends JpaRepository<Ingredient, Long> {

    List<Ingredient> findByActiveTrueOrderByNameAsc();

    List<Ingredient> findByCategoryAndActiveTrueOrderByNameAsc(String category);

    @Query("SELECT i FROM Ingredient i WHERE i.active = true AND " +
            "LOWER(i.name) LIKE LOWER(CONCAT('%', :q, '%'))")
    List<Ingredient> searchByName(@Param("q") String query);

    boolean existsByNameIgnoreCase(String name);

    @Query("SELECT DISTINCT i.category FROM Ingredient i WHERE i.active = true ORDER BY i.category")
    List<String> findDistinctCategories();
}