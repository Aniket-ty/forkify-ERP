package com.fooderp.service;

import com.fooderp.dto.MealPlanDto;
import com.fooderp.entity.*;
import com.fooderp.repository.*;
import com.fooderp.security.UserDetailsImpl;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class MealPlanService {

    @Autowired private MealPlanRepository     mealPlanRepo;
    @Autowired private MealPlanItemRepository itemRepo;
    @Autowired private RecipeRepository       recipeRepo;
    @Autowired private BranchRepository       branchRepo;
    @Autowired private InventoryItemRepository inventoryRepo;
    @Autowired private UserRepository         userRepo;

    // ── List plans visible to caller ──────────────────────────────────────────
    public List<MealPlanDto.Response> getPlans(Long branchId, Integer week, Integer year) {
        UserDetailsImpl caller = getCaller();
        List<MealPlan> plans;

        if (isAdmin(caller)) {
            if (week != null && year != null) {
                plans = branchId != null
                        ? mealPlanRepo.findVisibleToWeek(branchId, week, year)
                        : mealPlanRepo.findByBranchIsNullOrderByYearDescWeekNumberDesc();
            } else {
                plans = branchId != null
                        ? mealPlanRepo.findByBranchIdOrderByYearDescWeekNumberDesc(branchId)
                        : mealPlanRepo.findByBranchIsNullOrderByYearDescWeekNumberDesc();
            }
        } else {
            Long bid = caller.getBranchId();
            if (week != null && year != null) {
                plans = mealPlanRepo.findVisibleToWeek(bid, week, year);
            } else {
                plans = mealPlanRepo.findByBranchIdOrderByYearDescWeekNumberDesc(bid);
            }
        }

        return plans.stream().map(MealPlanDto.Response::from).collect(Collectors.toList());
    }

    // ── Get single plan ───────────────────────────────────────────────────────
    public MealPlanDto.Response getById(Long id) {
        return MealPlanDto.Response.from(findById(id));
    }

    // ── Create meal plan ──────────────────────────────────────────────────────
    public MealPlanDto.Response create(MealPlanDto.Request req, Long branchId) {
        UserDetailsImpl caller = getCaller();

        MealPlan plan = new MealPlan();
        plan.setPlanName(req.getPlanName());
        plan.setWeekNumber(req.getWeekNumber());
        plan.setYear(req.getYear());
        plan.setCreatedByHQ(isAdmin(caller));
        try {
            plan.setStatus(MealPlan.MealPlanStatus.valueOf(req.getStatus().toUpperCase()));
        } catch (Exception e) {
            plan.setStatus(MealPlan.MealPlanStatus.DRAFT);
        }

        // HQ admins creating a template leave branch null
        if (!isAdmin(caller) && caller.getBranchId() != null) {
            branchRepo.findById(caller.getBranchId()).ifPresent(plan::setBranch);
        } else if (branchId != null) {
            branchRepo.findById(branchId).ifPresent(plan::setBranch);
        }

        userRepo.findById(caller.getId()).ifPresent(plan::setCreatedBy);
        MealPlan saved = mealPlanRepo.save(plan);
        saveItems(saved, req.getItems());

        return MealPlanDto.Response.from(mealPlanRepo.findById(saved.getId()).orElseThrow());
    }

    // ── Update meal plan ──────────────────────────────────────────────────────
    public MealPlanDto.Response update(Long id, MealPlanDto.Request req) {
        MealPlan plan = findById(id);

        plan.setPlanName(req.getPlanName());
        plan.setWeekNumber(req.getWeekNumber());
        plan.setYear(req.getYear());
        try {
            plan.setStatus(MealPlan.MealPlanStatus.valueOf(req.getStatus().toUpperCase()));
        } catch (Exception ignored) {}

        // Clear and re-save items
        itemRepo.deleteByMealPlanId(id);
        MealPlan saved = mealPlanRepo.save(plan);
        saveItems(saved, req.getItems());

        return MealPlanDto.Response.from(mealPlanRepo.findById(saved.getId()).orElseThrow());
    }

    // ── Push HQ template to all (or selected) branches ───────────────────────
    public List<MealPlanDto.Response> pushToBranches(Long planId, List<Long> branchIds) {
        MealPlan template = findById(planId);

        List<Branch> targets = branchIds != null && !branchIds.isEmpty()
                ? branchRepo.findAllById(branchIds)
                : branchRepo.findByActiveTrue();

        List<MealPlanDto.Response> results = new ArrayList<>();

        for (Branch branch : targets) {
            // Skip HQ-type branch if desired (push only to BRANCH-type)
            if (branch.getType() == Branch.BranchType.HQ) continue;

            // Check if a plan already exists for this branch/week/year — update it
            MealPlan existing = mealPlanRepo
                    .findByBranchIdAndWeekNumberAndYear(
                            branch.getId(), template.getWeekNumber(), template.getYear())
                    .orElse(null);

            if (existing != null) {
                itemRepo.deleteByMealPlanId(existing.getId());
                existing.setPlanName(template.getPlanName());
                existing.setStatus(MealPlan.MealPlanStatus.ACTIVE);
                existing.setSourcePlan(template);
                copyItems(template, existing);
                results.add(MealPlanDto.Response.from(mealPlanRepo.save(existing)));
            } else {
                MealPlan copy = new MealPlan();
                copy.setPlanName(template.getPlanName());
                copy.setWeekNumber(template.getWeekNumber());
                copy.setYear(template.getYear());
                copy.setStatus(MealPlan.MealPlanStatus.ACTIVE);
                copy.setBranch(branch);
                copy.setCreatedByHQ(true);
                copy.setSourcePlan(template);
                copy.setCreatedBy(template.getCreatedBy());
                MealPlan saved = mealPlanRepo.save(copy);
                copyItems(template, saved);
                results.add(MealPlanDto.Response.from(mealPlanRepo.findById(saved.getId()).orElseThrow()));
            }
        }

        // Mark template as PUSHED
        template.setStatus(MealPlan.MealPlanStatus.PUSHED);
        mealPlanRepo.save(template);

        return results;
    }

    // ── Ingredient forecast for a plan ────────────────────────────────────────
    // Sums: each recipe ingredient qty × (expectedCovers / recipe.baseServings)
    public MealPlanDto.ForecastResponse getForecast(Long planId, Long branchId) {
        MealPlan plan = findById(planId);

        // Aggregate required quantities per ingredient across all meal plan items
        Map<Long, Double> requiredByIngredient = new LinkedHashMap<>();

        for (MealPlanItem item : plan.getItems()) {
            Recipe recipe = item.getRecipe();
            double scale = (double) item.getExpectedCovers() / recipe.getServings();

            for (RecipeIngredient ri : recipe.getIngredients()) {
                long ingId = ri.getIngredient().getId();
                double qty  = round3(ri.getQuantity() * scale);
                requiredByIngredient.merge(ingId, qty, Double::sum);
            }
        }

        // Get all ingredients involved
        Map<Long, Ingredient> ingredients = new HashMap<>();
        plan.getItems().forEach(item ->
                item.getRecipe().getIngredients().forEach(ri ->
                        ingredients.put(ri.getIngredient().getId(), ri.getIngredient())));

        // Build forecast items
        List<MealPlanDto.ForecastResponse.ForecastItem> forecastItems = new ArrayList<>();
        List<MealPlanDto.ForecastResponse.ShortageItem> shortages = new ArrayList<>();
        BigDecimal totalCost = BigDecimal.ZERO;

        for (Map.Entry<Long, Double> entry : requiredByIngredient.entrySet()) {
            Long ingId    = entry.getKey();
            double required = round3(entry.getValue());
            Ingredient ing = ingredients.get(ingId);

            // Look up current stock for this branch
            double currentStock = 0.0;
            if (branchId != null) {
                currentStock = inventoryRepo.findByIngredientIdAndBranchId(ingId, branchId)
                        .map(InventoryItem::getCurrentQuantity)
                        .orElse(0.0);
            }

            double shortfall = Math.max(0.0, required - currentStock);
            boolean sufficient = shortfall <= 0;

            BigDecimal unitCost = ing.getCostPerUnit();
            BigDecimal lineCost = unitCost.multiply(BigDecimal.valueOf(required))
                    .setScale(2, RoundingMode.HALF_UP);
            totalCost = totalCost.add(lineCost);

            MealPlanDto.ForecastResponse.ForecastItem fi = new MealPlanDto.ForecastResponse.ForecastItem();
            fi.setIngredientId(ingId);
            fi.setIngredientName(ing.getName());
            fi.setUnit(ing.getUnit());
            fi.setCategory(ing.getCategory());
            fi.setRequiredQuantity(required);
            fi.setCurrentStock(currentStock);
            fi.setShortfallQuantity(round3(shortfall));
            fi.setSufficient(sufficient);
            fi.setUnitCost(unitCost);
            fi.setTotalCost(lineCost);
            forecastItems.add(fi);

            if (!sufficient) {
                MealPlanDto.ForecastResponse.ShortageItem si = new MealPlanDto.ForecastResponse.ShortageItem();
                si.setIngredientId(ingId);
                si.setIngredientName(ing.getName());
                si.setUnit(ing.getUnit());
                si.setRequired(required);
                si.setAvailable(currentStock);
                si.setShortfall(round3(shortfall));
                shortages.add(si);
            }
        }

        // Sort: shortages first, then by ingredient name
        forecastItems.sort(Comparator.comparing(MealPlanDto.ForecastResponse.ForecastItem::isSufficient)
                .thenComparing(MealPlanDto.ForecastResponse.ForecastItem::getIngredientName));

        MealPlanDto.ForecastResponse response = new MealPlanDto.ForecastResponse();
        response.setMealPlanId(plan.getId());
        response.setPlanName(plan.getPlanName());
        response.setWeekNumber(plan.getWeekNumber());
        response.setYear(plan.getYear());
        response.setIngredients(forecastItems);
        response.setShortages(shortages);
        response.setTotalEstimatedCost(totalCost.setScale(2, RoundingMode.HALF_UP));
        return response;
    }

    // ── Delete plan ───────────────────────────────────────────────────────────
    public void delete(Long id) {
        mealPlanRepo.delete(findById(id));
    }

    // ── Private helpers ───────────────────────────────────────────────────────
    private MealPlan findById(Long id) {
        return mealPlanRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Meal plan not found: " + id));
    }

    private void saveItems(MealPlan plan, List<MealPlanDto.ItemRequest> requests) {
        if (requests == null) return;
        for (MealPlanDto.ItemRequest req : requests) {
            Recipe recipe = recipeRepo.findById(req.getRecipeId())
                    .orElseThrow(() -> new RuntimeException("Recipe not found: " + req.getRecipeId()));
            MealPlanItem item = new MealPlanItem();
            item.setMealPlan(plan);
            item.setRecipe(recipe);
            item.setDay(req.getDay());
            item.setMealType(MealPlanItem.MealType.valueOf(req.getMealType().toUpperCase()));
            item.setExpectedCovers(req.getExpectedCovers() != null ? req.getExpectedCovers() : 1);
            item.setDisplayName(req.getDisplayName());
            item.setNotes(req.getNotes());
            itemRepo.save(item);
        }
    }

    private void copyItems(MealPlan source, MealPlan target) {
        for (MealPlanItem src : source.getItems()) {
            MealPlanItem copy = new MealPlanItem();
            copy.setMealPlan(target);
            copy.setRecipe(src.getRecipe());
            copy.setDay(src.getDay());
            copy.setMealType(src.getMealType());
            copy.setExpectedCovers(src.getExpectedCovers());
            copy.setDisplayName(src.getDisplayName());
            copy.setNotes(src.getNotes());
            itemRepo.save(copy);
        }
    }

    private double round3(double v) {
        return Math.round(v * 1000.0) / 1000.0;
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
