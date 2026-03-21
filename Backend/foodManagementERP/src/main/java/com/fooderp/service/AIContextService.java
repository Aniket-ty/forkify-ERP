package com.fooderp.service;

import com.fooderp.entity.*;
import com.fooderp.repository.*;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

/**
 * AIContextService — builds a rich, live system-prompt context block
 * from the database so the AI has your COMPLETE data, not just what
 * the frontend happened to pass in.
 *
 * Called by AIController before every /api/ai/chat request.
 * branchId = null means HQ (sees everything).
 *
 * contextType (comma-separated keywords) controls which sections load:
 *   recipe | inventory | sales | wastage | supplier | meal | all
 */
@Service
@Transactional
public class AIContextService {

    @Autowired private RecipeRepository        recipeRepo;
    @Autowired private InventoryItemRepository inventoryRepo;
    @Autowired private SupplierRepository      supplierRepo;
    @Autowired private SalesEntryRepository    salesRepo;
    @Autowired private WastageRecordRepository wastageRepo;
    @Autowired private MealPlanRepository      mealPlanRepo;

    @Transactional
    public String buildContext(Long branchId, String contextType) {
        StringBuilder sb = new StringBuilder();

        boolean all     = contextType == null || contextType.isBlank() || contextType.equals("all");
        boolean recipes = all || contextType.contains("recipe")    || contextType.contains("nutrition") || contextType.contains("menu");
        boolean inv     = all || contextType.contains("inventory") || contextType.contains("stock");
        boolean sales   = all || contextType.contains("sales")     || contextType.contains("revenue");
        boolean waste   = all || contextType.contains("wastage")   || contextType.contains("waste");
        boolean supply  = all || contextType.contains("supplier")  || contextType.contains("procurement");
        boolean plan    = all || contextType.contains("meal")      || contextType.contains("plan");

        if (recipes) appendRecipes(sb, branchId);
        if (inv)     appendInventory(sb, branchId);
        if (sales)   appendSales(sb, branchId);
        if (waste)   appendWastage(sb, branchId);
        if (supply)  appendSuppliers(sb, branchId);
        if (plan)    appendMealPlans(sb, branchId);

        return sb.toString();
    }

    // ── RECIPES ───────────────────────────────────────────────────────────────
    private void appendRecipes(StringBuilder sb, Long branchId) {
        List<Recipe> list = branchId != null
                ? recipeRepo.findVisibleToBranch(branchId)
                : recipeRepo.findAllByOrderByCreatedAtDesc();

        sb.append("\n## COMPLETE RECIPE CATALOGUE (").append(list.size()).append(" recipes)\n");
        sb.append("Format: ID | Name | Category | Status | Servings | PrepMin | CookMin | Kcal | Protein(g) | Carbs(g) | Fat(g) | Fiber(g) | CostPerServing | Allergens | Tags\n");

        for (Recipe r : list) {
            BigDecimal total = r.getIngredients().stream()
                    .map(ri -> ri.getIngredient().getCostPerUnit()
                            .multiply(BigDecimal.valueOf(ri.getQuantity())))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal cps = r.getServings() > 0
                    ? total.divide(BigDecimal.valueOf(r.getServings()), 2, java.math.RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;

            sb.append(String.format(
                "R%d | %s | %s | %s | %d | %d | %d | %.0f | %.1f | %.1f | %.1f | %.1f | Rs%.2f | %s | %s%n",
                r.getId(), r.getName(), r.getCategory(), r.getStatus().name(),
                r.getServings(), r.getPrepTime(), r.getCookTime(),
                r.getCalories(), r.getProtein(), r.getCarbs(), r.getFat(), r.getFiber(),
                cps,
                r.getAllergens() != null ? r.getAllergens() : "none",
                r.getTags()      != null ? r.getTags()      : ""
            ));

            if (!r.getIngredients().isEmpty()) {
                String ings = r.getIngredients().stream()
                        .map(ri -> ri.getIngredient().getName() + " " + ri.getQuantity()
                                + (ri.getUnit() != null ? ri.getUnit() : ri.getIngredient().getUnit()))
                        .collect(Collectors.joining(", "));
                sb.append("  Ingredients: ").append(ings).append("\n");
            }
        }
    }

    // ── INVENTORY ─────────────────────────────────────────────────────────────
    private void appendInventory(StringBuilder sb, Long branchId) {
        List<InventoryItem> items = branchId != null
                ? inventoryRepo.findByBranchIdOrderByIngredientNameAsc(branchId)
                : inventoryRepo.findAll();

        sb.append("\n## LIVE INVENTORY (").append(items.size()).append(" items)\n");
        sb.append("Format: Ingredient | Category | CurrentQty | Unit | MinLevel | Status | UnitCost | TotalValue | Expiry\n");

        for (InventoryItem i : items) {
            sb.append(String.format(
                "%s | %s | %.2f | %s | min:%.2f | %s | Rs%.2f | Rs%.2f | %s%n",
                i.getIngredient().getName(),
                i.getIngredient().getCategory(),
                i.getCurrentQuantity(),
                i.getIngredient().getUnit(),
                i.getMinStockLevel(),
                i.getStockStatus().name(),
                i.getEffectiveUnitCost(),
                i.getTotalValue(),
                i.getExpiryDate() != null ? i.getExpiryDate() : "N/A"
            ));
        }

        long low = items.stream().filter(i ->
                i.getStockStatus() == InventoryItem.StockStatus.LOW ||
                i.getStockStatus() == InventoryItem.StockStatus.CRITICAL ||
                i.getStockStatus() == InventoryItem.StockStatus.OUT_OF_STOCK).count();
        long exp = items.stream().filter(i ->
                i.getExpiryDate() != null && !i.getExpiryDate().isAfter(LocalDate.now().plusDays(7))).count();

        if (low > 0) sb.append("ALERT: ").append(low).append(" items are LOW/CRITICAL/OUT_OF_STOCK.\n");
        if (exp > 0) sb.append("ALERT: ").append(exp).append(" items expire within 7 days.\n");
    }

    // ── SALES ─────────────────────────────────────────────────────────────────
    private void appendSales(StringBuilder sb, Long branchId) {
        LocalDate from = LocalDate.now().minusDays(30);
        LocalDate to   = LocalDate.now();

        List<SalesEntry> entries;
        if (branchId != null) {
            entries = salesRepo.findByBranchAndDateRange(branchId, from, to);
        } else {
            // findAll and filter — no cross-branch query exists
            entries = salesRepo.findAll().stream()
                    .filter(s -> !s.getSaleDate().isBefore(from))
                    .collect(Collectors.toList());
        }

        BigDecimal rev    = entries.stream().map(SalesEntry::getTotalRevenue).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal cogs   = entries.stream().map(SalesEntry::getCostOfGoods).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal profit = rev.subtract(cogs);
        double margin = rev.compareTo(BigDecimal.ZERO) > 0
                ? profit.divide(rev, 4, java.math.RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100)).doubleValue()
                : 0.0;

        sb.append("\n## SALES — LAST 30 DAYS (").append(entries.size()).append(" entries)\n");
        sb.append(String.format("Revenue: Rs%.2f | COGS: Rs%.2f | Gross Profit: Rs%.2f | Margin: %.1f%%%n",
                rev, cogs, profit, margin));

        sb.append("Top recipes by units sold:\n");
        entries.stream()
                .collect(Collectors.groupingBy(
                        s -> s.getRecipe().getName(),
                        Collectors.summingInt(SalesEntry::getQuantitySold)))
                .entrySet().stream()
                .sorted((a, b) -> b.getValue().compareTo(a.getValue()))
                .limit(10)
                .forEach(e -> sb.append(String.format("  %s: %d units%n", e.getKey(), e.getValue())));

        sb.append("Daily revenue (last 7 days):\n");
        entries.stream()
                .filter(s -> !s.getSaleDate().isBefore(LocalDate.now().minusDays(7)))
                .collect(Collectors.groupingBy(SalesEntry::getSaleDate,
                        Collectors.reducing(BigDecimal.ZERO, SalesEntry::getTotalRevenue, BigDecimal::add)))
                .entrySet().stream()
                .sorted((a, b) -> b.getKey().compareTo(a.getKey()))
                .forEach(e -> sb.append(String.format("  %s: Rs%.2f%n", e.getKey(), e.getValue())));
    }

    // ── WASTAGE ───────────────────────────────────────────────────────────────
    private void appendWastage(StringBuilder sb, Long branchId) {
        List<WastageRecord> records = branchId != null
                ? wastageRepo.findByBranchIdOrderByCreatedAtDesc(branchId)
                : wastageRepo.findAll();

        // Filter to last 30 days
        LocalDate cutoff = LocalDate.now().minusDays(30);
        List<WastageRecord> recent = records.stream()
                .filter(r -> r.getWastageDate() != null && !r.getWastageDate().isBefore(cutoff))
                .collect(Collectors.toList());

        BigDecimal loss = recent.stream()
                .filter(r -> r.getStatus() == WastageRecord.WastageStatus.APPROVED)
                .map(r -> r.getCostLoss() != null ? r.getCostLoss() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        long pending = recent.stream().filter(r -> r.getStatus() == WastageRecord.WastageStatus.PENDING).count();

        sb.append("\n## WASTAGE — LAST 30 DAYS (").append(recent.size()).append(" records)\n");
        sb.append(String.format("Approved loss: Rs%.2f | Pending approval: %d%n", loss, pending));

        sb.append("By reason: ");
        String reasonSummary = recent.stream()
                .collect(Collectors.groupingBy(r -> r.getReason().name(), Collectors.counting()))
                .entrySet().stream()
                .sorted((a, b) -> b.getValue().compareTo(a.getValue()))
                .map(e -> e.getKey() + ":" + e.getValue())
                .collect(Collectors.joining(", "));
        sb.append(reasonSummary).append("\n");
    }

    // ── SUPPLIERS ─────────────────────────────────────────────────────────────
    private void appendSuppliers(StringBuilder sb, Long branchId) {
        List<Supplier> list = branchId != null
                ? supplierRepo.findVisibleToBranch(branchId)
                : supplierRepo.findAllByOrderByNameAsc();

        sb.append("\n## SUPPLIERS (").append(list.size()).append(" total)\n");
        sb.append("Format: Name | Category | Status | Rating | TotalOrders | PaymentTerms\n");

        for (Supplier s : list) {
            sb.append(String.format("%s | %s | %s | %.1f★ | %d orders | %s%n",
                    s.getName(),
                    s.getCategory() != null ? s.getCategory() : "General",
                    s.getStatus().name(),
                    s.getRating(),
                    s.getTotalOrders(),
                    s.getPaymentTerms() != null ? s.getPaymentTerms() : "N/A"));
        }
    }

    // ── MEAL PLANS ────────────────────────────────────────────────────────────
    private void appendMealPlans(StringBuilder sb, Long branchId) {
        // HQ templates + branch-specific
        List<MealPlan> hqPlans     = mealPlanRepo.findByBranchIsNullOrderByYearDescWeekNumberDesc();
        List<MealPlan> branchPlans = branchId != null
                ? mealPlanRepo.findByBranchIdOrderByYearDescWeekNumberDesc(branchId)
                : List.of();

        List<MealPlan> active = java.util.stream.Stream
                .concat(hqPlans.stream(), branchPlans.stream())
                .filter(p -> p.getStatus() == MealPlan.MealPlanStatus.ACTIVE
                          || p.getStatus() == MealPlan.MealPlanStatus.PUSHED)
                .limit(4)
                .collect(Collectors.toList());

        if (active.isEmpty()) return;

        sb.append("\n## ACTIVE MEAL PLANS\n");
        for (MealPlan p : active) {
            sb.append(String.format("Plan: %s | Week %d/%d | %d items%n",
                    p.getPlanName(), p.getWeekNumber(), p.getYear(), p.getItems().size()));
            p.getItems().forEach(item -> sb.append(String.format(
                "  %s %s: %s (%d srv)%n",
                dayName(item.getDay()), item.getMealType().name(),
                item.getRecipe() != null ? item.getRecipe().getName() : "TBD",
                item.getExpectedCovers()
            )));
        }
    }

    private String dayName(int day) {
        String[] days = {"Mon","Tue","Wed","Thu","Fri","Sat","Sun"};
        return (day >= 1 && day <= 7) ? days[day - 1] : "Day" + day;
    }

}