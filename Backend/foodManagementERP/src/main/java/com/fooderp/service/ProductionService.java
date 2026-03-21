package com.fooderp.service;

import com.fooderp.dto.ProductionDto;
import com.fooderp.entity.*;
import com.fooderp.repository.*;
import com.fooderp.security.UserDetailsImpl;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class ProductionService {

    @Autowired private ProductionLogRepository     productionRepo;
    @Autowired private RecipeRepository             recipeRepo;
    @Autowired private InventoryItemRepository      inventoryRepo;
    @Autowired private StockTransactionRepository   txRepo;
    @Autowired private BranchRepository             branchRepo;
    @Autowired private UserRepository               userRepo;
    @Autowired private FinishedGoodStockRepository  fgStockRepo;   // ← NEW

    // ── Preview ───────────────────────────────────────────────────────────────
    public ProductionDto.DeductionPreview preview(Long branchId, Long recipeId, Integer servingsProduced) {
        Recipe recipe = recipeRepo.findById(recipeId)
                .orElseThrow(() -> new RuntimeException("Recipe not found: " + recipeId));

        double scale = (double) servingsProduced / recipe.getServings();

        ProductionDto.DeductionPreview preview = new ProductionDto.DeductionPreview();
        preview.setRecipeId(recipeId);
        preview.setRecipeName(recipe.getName());
        preview.setServingsProduced(servingsProduced);
        preview.setBaseServings(recipe.getServings());

        List<ProductionDto.DeductionPreview.IngredientDeduction> deductions = new ArrayList<>();
        List<String> insufficientItems = new ArrayList<>();
        BigDecimal totalCost = BigDecimal.ZERO;

        for (RecipeIngredient ri : recipe.getIngredients()) {
            double required = round3(ri.getQuantity() * scale);
            Optional<InventoryItem> itemOpt = inventoryRepo
                    .findByIngredientIdAndBranchId(ri.getIngredient().getId(), branchId);
            double available = itemOpt.map(InventoryItem::getCurrentQuantity).orElse(0.0);
            boolean sufficient = available >= required;
            if (!sufficient) {
                insufficientItems.add(ri.getIngredient().getName()
                        + " (need " + required + " " + ri.getIngredient().getUnit()
                        + ", have " + available + ")");
            }
            BigDecimal unitCost = ri.getIngredient().getCostPerUnit();
            BigDecimal lineCost = unitCost.multiply(BigDecimal.valueOf(required))
                    .setScale(2, RoundingMode.HALF_UP);
            totalCost = totalCost.add(lineCost);

            ProductionDto.DeductionPreview.IngredientDeduction d =
                    new ProductionDto.DeductionPreview.IngredientDeduction();
            d.setIngredientId(ri.getIngredient().getId());
            d.setIngredientName(ri.getIngredient().getName());
            d.setUnit(ri.getIngredient().getUnit());
            d.setRequiredQty(required);
            d.setAvailableQty(available);
            d.setSufficient(sufficient);
            d.setUnitCost(unitCost);
            d.setLineCost(lineCost);
            deductions.add(d);
        }

        preview.setDeductions(deductions);
        preview.setInsufficientItems(insufficientItems);
        preview.setEstimatedCost(totalCost);
        return preview;
    }

    // ── Log Production ────────────────────────────────────────────────────────
    public ProductionDto.Response logProduction(Long branchId, ProductionDto.Request req) {
        UserDetailsImpl caller = getCaller();

        Recipe recipe = recipeRepo.findById(req.getRecipeId())
                .orElseThrow(() -> new RuntimeException("Recipe not found: " + req.getRecipeId()));
        Branch branch = branchRepo.findById(branchId)
                .orElseThrow(() -> new RuntimeException("Branch not found: " + branchId));

        double scale = (double) req.getServingsProduced() / recipe.getServings();

        // ── Step 1: Validate stock ────────────────────────────────────────────
        List<String> insufficient = new ArrayList<>();
        for (RecipeIngredient ri : recipe.getIngredients()) {
            double required = round3(ri.getQuantity() * scale);
            InventoryItem item = inventoryRepo
                    .findByIngredientIdAndBranchId(ri.getIngredient().getId(), branchId)
                    .orElse(null);
            double available = item != null ? item.getCurrentQuantity() : 0.0;
            if (available < required) {
                insufficient.add(ri.getIngredient().getName()
                        + ": need " + required + " " + ri.getIngredient().getUnit()
                        + ", available " + available);
            }
        }
        if (!insufficient.isEmpty()) {
            throw new RuntimeException("Insufficient stock for production:\n"
                    + String.join("\n", insufficient));
        }

        // ── Step 2: Deduct raw ingredients → STOCK_OUT transactions ──────────
        BigDecimal totalCost = BigDecimal.ZERO;
        String prodRef = "PROD-" + recipe.getId() + "-" + System.currentTimeMillis();

        for (RecipeIngredient ri : recipe.getIngredients()) {
            double required = round3(ri.getQuantity() * scale);
            InventoryItem item = inventoryRepo
                    .findByIngredientIdAndBranchId(ri.getIngredient().getId(), branchId)
                    .orElseThrow(() -> new RuntimeException(
                            "Inventory not found for " + ri.getIngredient().getName()));

            double newQty = round3(item.getCurrentQuantity() - required);
            item.setCurrentQuantity(newQty);
            inventoryRepo.save(item);

            StockTransaction tx = new StockTransaction();
            tx.setIngredient(ri.getIngredient());
            tx.setBranch(branch);
            tx.setType(StockTransaction.TransactionType.STOCK_OUT);
            tx.setQuantity(required);
            tx.setUnitCost(ri.getIngredient().getCostPerUnit());
            tx.setBalanceAfter(newQty);
            tx.setReferenceNo(prodRef);
            tx.setNotes("Production: " + recipe.getName()
                    + " × " + req.getServingsProduced() + " servings");
            userRepo.findById(caller.getId()).ifPresent(tx::setCreatedBy);
            txRepo.save(tx);

            totalCost = totalCost.add(
                    ri.getIngredient().getCostPerUnit()
                            .multiply(BigDecimal.valueOf(required))
                            .setScale(2, RoundingMode.HALF_UP));
        }

        BigDecimal costPerServing = req.getServingsProduced() > 0
                ? totalCost.divide(BigDecimal.valueOf(req.getServingsProduced()), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        // ── Step 3: Add to FinishedGoodStock (the "freeze" table) ────────────
        FinishedGoodStock fgStock = fgStockRepo
                .findByRecipeIdAndBranchId(recipe.getId(), branchId)
                .orElseGet(() -> {
                    FinishedGoodStock s = new FinishedGoodStock();
                    s.setRecipe(recipe);
                    s.setBranch(branch);
                    s.setAvailableServings(0);
                    s.setTotalProduced(0);
                    s.setTotalSold(0);
                    s.setTotalWasted(0);
                    return s;
                });

        fgStock.setAvailableServings(fgStock.getAvailableServings() + req.getServingsProduced());
        fgStock.setTotalProduced(fgStock.getTotalProduced() + req.getServingsProduced());
        fgStock.setCostPerServing(costPerServing);
        fgStock.setLastProducedDate(LocalDate.now());
        fgStockRepo.save(fgStock);

        // ── Step 4: Save production log ───────────────────────────────────────
        ProductionLog log = new ProductionLog();
        log.setRecipe(recipe);
        log.setBranch(branch);
        log.setServingsProduced(req.getServingsProduced());
        log.setTotalCost(totalCost.setScale(2, RoundingMode.HALF_UP));
        log.setCostPerServing(costPerServing);
        log.setNotes(req.getNotes());
        userRepo.findById(caller.getId()).ifPresent(log::setLoggedBy);

        return ProductionDto.Response.from(productionRepo.save(log));
    }

    // ── History ───────────────────────────────────────────────────────────────
    public List<ProductionDto.Response> getHistory(Long branchId, String date, Long recipeId) {
        List<ProductionLog> logs;
        if (recipeId != null) {
            logs = productionRepo.findByBranchIdAndRecipeIdOrderByCreatedAtDesc(branchId, recipeId);
        } else if (date != null && !date.isBlank()) {
            logs = productionRepo.findByBranchIdAndProductionDateOrderByCreatedAtDesc(
                    branchId, LocalDate.parse(date));
        } else {
            logs = productionRepo.findByBranchIdOrderByCreatedAtDesc(branchId);
        }
        return logs.stream().map(ProductionDto.Response::from).collect(Collectors.toList());
    }

    // ── Get finished good stock levels ────────────────────────────────────────
    public List<FinishedGoodStock> getStockLevels(Long branchId) {
        return fgStockRepo.findByBranchIdOrderByRecipeNameAsc(branchId);
    }

    private double round3(double v) {
        return Math.round(v * 1000.0) / 1000.0;
    }

    private UserDetailsImpl getCaller() {
        return (UserDetailsImpl) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
    }
}