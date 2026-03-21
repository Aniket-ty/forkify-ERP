package com.fooderp.service;

import com.fooderp.dto.RecipeDto;
import com.fooderp.entity.*;
import com.fooderp.repository.*;
import com.fooderp.security.UserDetailsImpl;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class RecipeService {

    @Autowired private RecipeRepository           recipeRepo;
    @Autowired private RecipeIngredientRepository riRepo;
    @Autowired private IngredientRepository       ingredientRepo;
    @Autowired private BranchRepository           branchRepo;
    @Autowired private UserRepository             userRepo;

    // ── List recipes visible to caller ───────────────────────────────────────
    public List<RecipeDto.Summary> getRecipes(String search, String category) {
        UserDetailsImpl caller = getCaller();
        List<Recipe> recipes;

        if (isAdmin(caller)) {
            recipes = search != null && !search.isBlank()
                    ? recipeRepo.searchByName(search)
                    : recipeRepo.findAllByOrderByCreatedAtDesc();
        } else {
            Long branchId = caller.getBranchId();
            recipes = search != null && !search.isBlank()
                    ? recipeRepo.searchByNameForBranch(branchId, search)
                    : recipeRepo.findVisibleToBranch(branchId);
        }

        if (category != null && !category.isBlank() && !category.equals("all")) {
            recipes = recipes.stream()
                    .filter(r -> r.getCategory().equalsIgnoreCase(category))
                    .collect(Collectors.toList());
        }

        return recipes.stream()
                .map(r -> RecipeDto.Summary.from(r, calcTotalCost(r)))
                .collect(Collectors.toList());
    }

    // ── Get single recipe with full ingredient detail ─────────────────────────
    public RecipeDto.Response getRecipeById(Long id) {
        Recipe recipe = recipeRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Recipe not found: " + id));
        checkReadAccess(recipe);
        return RecipeDto.Response.from(recipe, calcTotalCost(recipe));
    }

    // ── Create recipe ─────────────────────────────────────────────────────────
    public RecipeDto.Response createRecipe(RecipeDto.Request req) {
        UserDetailsImpl caller = getCaller();

        Recipe recipe = new Recipe();
        mapRequestToEntity(req, recipe);

        // Only admins can create HQ-owned recipes
        recipe.setHqOwned(isAdmin(caller) && req.isHqOwned());

        // Assign to caller's branch (null for HQ admins creating global recipes)
        if (!isAdmin(caller) && caller.getBranchId() != null) {
            branchRepo.findById(caller.getBranchId()).ifPresent(recipe::setBranch);
        }

        userRepo.findById(caller.getId()).ifPresent(recipe::setCreatedBy);

        Recipe saved = recipeRepo.save(recipe);
        saveIngredients(saved, req.getIngredients());

        Recipe fresh = recipeRepo.findById(saved.getId()).orElseThrow();
        return RecipeDto.Response.from(fresh, calcTotalCost(fresh));
    }

    // ── Update recipe ─────────────────────────────────────────────────────────
    public RecipeDto.Response updateRecipe(Long id, RecipeDto.Request req) {
        Recipe recipe = recipeRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Recipe not found: " + id));
        checkWriteAccess(recipe);

        mapRequestToEntity(req, recipe);
        riRepo.deleteByRecipeId(id);
        Recipe saved = recipeRepo.save(recipe);
        saveIngredients(saved, req.getIngredients());

        Recipe fresh = recipeRepo.findById(saved.getId()).orElseThrow();
        return RecipeDto.Response.from(fresh, calcTotalCost(fresh));
    }

    // ── Delete recipe ─────────────────────────────────────────────────────────
    public void deleteRecipe(Long id) {
        Recipe recipe = recipeRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Recipe not found: " + id));
        checkWriteAccess(recipe);
        recipeRepo.delete(recipe);
    }

    // ── Live cost for a specific serving count ────────────────────────────────
    public RecipeDto.Response getRecipeCost(Long id, Integer servings) {
        Recipe recipe = recipeRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Recipe not found: " + id));
        checkReadAccess(recipe);
        BigDecimal totalCost = calcTotalCost(recipe);
        RecipeDto.Response dto = RecipeDto.Response.from(recipe, totalCost);
        // Scale cost to requested servings if different from base
        if (servings != null && servings > 0 && !servings.equals(recipe.getServings())) {
            BigDecimal scale = BigDecimal.valueOf((double) servings / recipe.getServings());
            dto.setTotalCost(totalCost.multiply(scale).setScale(2, java.math.RoundingMode.HALF_UP));
            dto.setCostPerServing(dto.getTotalCost()
                    .divide(BigDecimal.valueOf(servings), 2, java.math.RoundingMode.HALF_UP));
        }
        return dto;
    }

    // ── Distinct categories ───────────────────────────────────────────────────
    public List<String> getCategories() {
        return recipeRepo.findDistinctCategories();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private BigDecimal calcTotalCost(Recipe recipe) {
        return recipe.getIngredients().stream()
                .map(ri -> ri.getIngredient().getCostPerUnit()
                        .multiply(BigDecimal.valueOf(ri.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, java.math.RoundingMode.HALF_UP);
    }

    private void mapRequestToEntity(RecipeDto.Request req, Recipe recipe) {
        recipe.setName(req.getName());
        recipe.setDescription(req.getDescription());
        recipe.setCategory(req.getCategory());
        recipe.setServings(req.getServings() != null ? req.getServings() : 1);
        recipe.setPrepTime(req.getPrepTime() != null ? req.getPrepTime() : 0);
        recipe.setCookTime(req.getCookTime() != null ? req.getCookTime() : 0);
        recipe.setTags(req.getTags());
        recipe.setImageUrl(req.getImageUrl());
        recipe.setCalories(req.getCalories() != null ? req.getCalories() : 0.0);
        recipe.setProtein(req.getProtein() != null ? req.getProtein() : 0.0);
        recipe.setCarbs(req.getCarbs() != null ? req.getCarbs() : 0.0);
        recipe.setFat(req.getFat() != null ? req.getFat() : 0.0);
        recipe.setFiber(req.getFiber() != null ? req.getFiber() : 0.0);
        recipe.setAllergens(req.getAllergens());
        try {
            recipe.setStatus(Recipe.RecipeStatus.valueOf(
                    req.getStatus() != null ? req.getStatus().toUpperCase() : "DRAFT"));
        } catch (IllegalArgumentException e) {
            recipe.setStatus(Recipe.RecipeStatus.DRAFT);
        }
    }

    private void saveIngredients(Recipe recipe, List<RecipeDto.IngredientLineRequest> lines) {
        if (lines == null) return;
        for (RecipeDto.IngredientLineRequest line : lines) {
            Ingredient ingredient = ingredientRepo.findById(line.getIngredientId())
                    .orElseThrow(() -> new RuntimeException("Ingredient not found: " + line.getIngredientId()));
            RecipeIngredient ri = new RecipeIngredient();
            ri.setRecipe(recipe);
            ri.setIngredient(ingredient);
            ri.setQuantity(line.getQuantity());
            ri.setUnit(line.getUnit());
            ri.setNotes(line.getNotes());
            riRepo.save(ri);
        }
    }

    private void checkReadAccess(Recipe recipe) {
        UserDetailsImpl caller = getCaller();
        if (isAdmin(caller)) return;
        // Branch user can read global recipes OR their own branch recipes
        if (recipe.getBranch() != null
                && !recipe.getBranch().getId().equals(caller.getBranchId())) {
            throw new AccessDeniedException("You do not have access to this recipe");
        }
    }

    private void checkWriteAccess(Recipe recipe) {
        UserDetailsImpl caller = getCaller();
        if (isAdmin(caller)) return;
        // HQ-owned recipes cannot be edited by branch managers
        if (recipe.isHqOwned()) {
            throw new AccessDeniedException("HQ-owned recipes cannot be modified by branch users");
        }
        // Branch managers can only edit their own branch's recipes
        if (recipe.getBranch() == null
                || !recipe.getBranch().getId().equals(caller.getBranchId())) {
            throw new AccessDeniedException("You can only edit your own branch's recipes");
        }
    }

    private UserDetailsImpl getCaller() {
        return (UserDetailsImpl) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
    }

    private boolean isAdmin(UserDetailsImpl user) {
        return user.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }
}