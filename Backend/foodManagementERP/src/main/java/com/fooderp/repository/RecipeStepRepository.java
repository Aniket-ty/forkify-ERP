package com.fooderp.repository;

import com.fooderp.entity.RecipeStep;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface RecipeStepRepository extends JpaRepository<RecipeStep, Long> {

    List<RecipeStep> findByRecipeIdOrderByStepNumberAsc(Long recipeId);

    @Modifying
    @Transactional
    @Query("DELETE FROM RecipeStep rs WHERE rs.recipe.id = :recipeId")
    void deleteByRecipeId(@Param("recipeId") Long recipeId);
}