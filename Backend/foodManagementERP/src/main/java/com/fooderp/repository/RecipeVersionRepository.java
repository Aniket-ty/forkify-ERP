package com.fooderp.repository;

import com.fooderp.entity.RecipeVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface RecipeVersionRepository extends JpaRepository<RecipeVersion, Long> {
    List<RecipeVersion> findByRecipeIdOrderByVersionDesc(Long recipeId);
    Optional<RecipeVersion> findTopByRecipeIdOrderByVersionDesc(Long recipeId);
    int countByRecipeId(Long recipeId);
}