package com.fooderp.service;

import com.fooderp.dto.InventoryDto;
import com.fooderp.entity.*;
import com.fooderp.repository.*;
import com.fooderp.security.UserDetailsImpl;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class InventoryService {

    @Autowired private InventoryItemRepository     itemRepo;
    @Autowired private StockTransactionRepository  txRepo;
    @Autowired private WastageRecordRepository     wastageRepo;
    @Autowired private IngredientRepository        ingredientRepo;
    @Autowired private BranchRepository            branchRepo;
    @Autowired private UserRepository              userRepo;
    @Autowired private RecipeRepository            recipeRepo;          // ← for finished product wastage
    @Autowired private FinishedGoodStockRepository fgStockRepo;         // ← for finished product wastage

    // ── Summary ───────────────────────────────────────────────────────────────
    public InventoryDto.Summary getSummary(Long branchId) {
        InventoryDto.Summary s = new InventoryDto.Summary();
        s.setTotalItems(itemRepo.findByBranchIdOrderByIngredientNameAsc(branchId).size());
        s.setLowStockCount(itemRepo.countLowStockByBranch(branchId));
        s.setExpiringCount(itemRepo.findExpiringByBranch(branchId, LocalDate.now().plusDays(7)).size());
        s.setPendingWastage(wastageRepo.countPendingByBranch(branchId));
        BigDecimal val = itemRepo.sumTotalValueByBranch(branchId);
        s.setTotalValue(val != null ? val.setScale(2, java.math.RoundingMode.HALF_UP) : BigDecimal.ZERO);
        return s;
    }

    // ── Inventory list ────────────────────────────────────────────────────────
    public List<InventoryDto.ItemResponse> getInventory(Long branchId) {
        return itemRepo.findByBranchIdOrderByIngredientNameAsc(branchId)
                .stream().map(InventoryDto.ItemResponse::from).collect(Collectors.toList());
    }

    public List<InventoryDto.ItemResponse> getLowStock(Long branchId) {
        return itemRepo.findLowStockByBranch(branchId)
                .stream().map(InventoryDto.ItemResponse::from).collect(Collectors.toList());
    }

    public List<InventoryDto.ItemResponse> getExpiring(Long branchId, int days) {
        LocalDate cutoff = LocalDate.now().plusDays(days);
        return itemRepo.findExpiringByBranch(branchId, cutoff)
                .stream().map(InventoryDto.ItemResponse::from).collect(Collectors.toList());
    }

    // ── Upsert inventory item ─────────────────────────────────────────────────
    public InventoryDto.ItemResponse upsertItem(Long branchId, InventoryDto.ItemRequest req) {
        Branch branch = branchRepo.findById(branchId)
                .orElseThrow(() -> new RuntimeException("Branch not found"));
        Ingredient ingredient = ingredientRepo.findById(req.getIngredientId())
                .orElseThrow(() -> new RuntimeException("Ingredient not found"));
        InventoryItem item = itemRepo.findByIngredientIdAndBranchId(req.getIngredientId(), branchId)
                .orElse(new InventoryItem());
        item.setBranch(branch);
        item.setIngredient(ingredient);
        item.setCurrentQuantity(req.getCurrentQuantity() != null ? req.getCurrentQuantity() : 0.0);
        item.setMinStockLevel(req.getMinStockLevel() != null ? req.getMinStockLevel() : 0.0);
        item.setLocation(req.getLocation());
        item.setUnitCost(req.getUnitCost());
        if (req.getExpiryDate() != null && !req.getExpiryDate().isBlank())
            item.setExpiryDate(LocalDate.parse(req.getExpiryDate()));
        return InventoryDto.ItemResponse.from(itemRepo.save(item));
    }

    // ── Stock In ──────────────────────────────────────────────────────────────
    public InventoryDto.ItemResponse stockIn(Long branchId, InventoryDto.StockInRequest req) {
        UserDetailsImpl caller = getCaller();
        Branch branch = branchRepo.findById(branchId)
                .orElseThrow(() -> new RuntimeException("Branch not found"));
        Ingredient ingredient = ingredientRepo.findById(req.getIngredientId())
                .orElseThrow(() -> new RuntimeException("Ingredient not found"));

        InventoryItem item = itemRepo.findByIngredientIdAndBranchId(req.getIngredientId(), branchId)
                .orElse(new InventoryItem());
        if (item.getId() == null) { item.setBranch(branch); item.setIngredient(ingredient); }

        double newQty = item.getCurrentQuantity() + req.getQuantity();
        item.setCurrentQuantity(newQty);
        if (req.getUnitCost() != null) item.setUnitCost(req.getUnitCost());
        if (req.getExpiryDate() != null && !req.getExpiryDate().isBlank())
            item.setExpiryDate(LocalDate.parse(req.getExpiryDate()));
        InventoryItem saved = itemRepo.save(item);

        StockTransaction tx = new StockTransaction();
        tx.setIngredient(ingredient); tx.setBranch(branch);
        tx.setType(StockTransaction.TransactionType.STOCK_IN);
        tx.setQuantity(req.getQuantity());
        tx.setUnitCost(req.getUnitCost() != null ? req.getUnitCost() : ingredient.getCostPerUnit());
        tx.setBalanceAfter(newQty); tx.setReferenceNo(req.getReferenceNo());
        tx.setSupplier(req.getSupplier()); tx.setNotes(req.getNotes());
        if (req.getExpiryDate() != null && !req.getExpiryDate().isBlank())
            tx.setExpiryDate(LocalDate.parse(req.getExpiryDate()));
        userRepo.findById(caller.getId()).ifPresent(tx::setCreatedBy);
        txRepo.save(tx);

        if (req.getUnitCost() != null) {
            ingredient.setCostPerUnit(req.getUnitCost()); ingredientRepo.save(ingredient);
        }
        return InventoryDto.ItemResponse.from(saved);
    }

    // ── Log Wastage — supports INGREDIENT and FINISHED_PRODUCT ───────────────
    public InventoryDto.WastageResponse logWastage(Long branchId, InventoryDto.WastageRequest req) {
        UserDetailsImpl caller = getCaller();
        Branch branch = branchRepo.findById(branchId)
                .orElseThrow(() -> new RuntimeException("Branch not found"));

        WastageRecord wastage = new WastageRecord();
        wastage.setBranch(branch);
        wastage.setQuantity(req.getQuantity());
        wastage.setReason(WastageRecord.WastageReason.valueOf(req.getReason().toUpperCase()));
        wastage.setReferenceNo(req.getReferenceNo());
        wastage.setNotes(req.getNotes());
        wastage.setStatus(WastageRecord.WastageStatus.PENDING);
        userRepo.findById(caller.getId()).ifPresent(wastage::setLoggedBy);

        boolean isFinishedProduct = req.getWastageType() != null
                && "FINISHED_PRODUCT".equalsIgnoreCase(req.getWastageType());

        if (isFinishedProduct) {
            // ── Finished product wastage ──────────────────────────────────
            if (req.getRecipeId() == null)
                throw new RuntimeException("Recipe ID required for finished product wastage");

            Recipe recipe = recipeRepo.findById(req.getRecipeId())
                    .orElseThrow(() -> new RuntimeException("Recipe not found"));

            FinishedGoodStock fg = fgStockRepo
                    .findByRecipeIdAndBranchId(req.getRecipeId(), branchId)
                    .orElseThrow(() -> new RuntimeException(
                            "No finished stock found for " + recipe.getName()));

            if (fg.getAvailableServings() < req.getQuantity().intValue())
                throw new RuntimeException("Only " + fg.getAvailableServings()
                        + " servings available, cannot waste " + req.getQuantity().intValue());

            wastage.setWastageType(WastageRecord.WastageType.FINISHED_PRODUCT);
            wastage.setRecipe(recipe);
            // Cost loss = servings × costPerServing
            BigDecimal costPerServing = fg.getCostPerServing() != null
                    ? fg.getCostPerServing() : BigDecimal.ZERO;
            wastage.setCostLoss(costPerServing
                    .multiply(BigDecimal.valueOf(req.getQuantity()))
                    .setScale(2, java.math.RoundingMode.HALF_UP));

        } else {
            // ── Ingredient wastage ────────────────────────────────────────
            if (req.getIngredientId() == null)
                throw new RuntimeException("Ingredient ID required for ingredient wastage");

            Ingredient ingredient = ingredientRepo.findById(req.getIngredientId())
                    .orElseThrow(() -> new RuntimeException("Ingredient not found"));
            InventoryItem item = itemRepo
                    .findByIngredientIdAndBranchId(req.getIngredientId(), branchId)
                    .orElseThrow(() -> new RuntimeException(
                            "No inventory record for " + ingredient.getName()));

            if (item.getCurrentQuantity() < req.getQuantity())
                throw new RuntimeException("Insufficient stock: available "
                        + item.getCurrentQuantity() + " " + ingredient.getUnit()
                        + ", requested " + req.getQuantity());

            wastage.setWastageType(WastageRecord.WastageType.INGREDIENT);
            wastage.setIngredient(ingredient);
            wastage.setCostLoss(ingredient.getCostPerUnit()
                    .multiply(BigDecimal.valueOf(req.getQuantity()))
                    .setScale(2, java.math.RoundingMode.HALF_UP));
        }

        return InventoryDto.WastageResponse.from(wastageRepo.save(wastage));
    }

    // ── Approve Wastage ───────────────────────────────────────────────────────
    public InventoryDto.WastageResponse approveWastage(Long wastageId) {
        UserDetailsImpl caller = getCaller();
        WastageRecord wastage = wastageRepo.findById(wastageId)
                .orElseThrow(() -> new RuntimeException("Wastage record not found"));

        if (wastage.getStatus() != WastageRecord.WastageStatus.PENDING)
            throw new RuntimeException("Only PENDING wastage can be approved");

        if (wastage.getWastageType() == WastageRecord.WastageType.FINISHED_PRODUCT) {
            // ── Deduct from FinishedGoodStock ─────────────────────────────
            FinishedGoodStock fg = fgStockRepo
                    .findByRecipeIdAndBranchId(wastage.getRecipe().getId(), wastage.getBranch().getId())
                    .orElseThrow(() -> new RuntimeException("Finished stock record not found"));
            int newServings = Math.max(0, fg.getAvailableServings() - wastage.getQuantity().intValue());
            fg.setAvailableServings(newServings);
            fg.setTotalWasted(fg.getTotalWasted() + wastage.getQuantity().intValue());
            fgStockRepo.save(fg);
        } else {
            // ── Deduct from raw ingredient inventory ──────────────────────
            InventoryItem item = itemRepo
                    .findByIngredientIdAndBranchId(
                            wastage.getIngredient().getId(), wastage.getBranch().getId())
                    .orElseThrow(() -> new RuntimeException("Inventory item not found"));
            double newQty = Math.max(0, item.getCurrentQuantity() - wastage.getQuantity());
            item.setCurrentQuantity(newQty);
            itemRepo.save(item);

            StockTransaction tx = new StockTransaction();
            tx.setIngredient(wastage.getIngredient()); tx.setBranch(wastage.getBranch());
            tx.setType(StockTransaction.TransactionType.WASTAGE);
            tx.setQuantity(wastage.getQuantity());
            tx.setUnitCost(wastage.getIngredient().getCostPerUnit());
            tx.setBalanceAfter(newQty); tx.setReferenceNo(wastage.getReferenceNo());
            tx.setNotes("Wastage approved: " + wastage.getReason().name());
            userRepo.findById(caller.getId()).ifPresent(tx::setCreatedBy);
            txRepo.save(tx);
        }

        wastage.setStatus(WastageRecord.WastageStatus.APPROVED);
        wastage.setApprovedAt(java.time.LocalDateTime.now());
        userRepo.findById(caller.getId()).ifPresent(wastage::setApprovedBy);
        return InventoryDto.WastageResponse.from(wastageRepo.save(wastage));
    }

    // ── Reject Wastage ────────────────────────────────────────────────────────
    public InventoryDto.WastageResponse rejectWastage(Long wastageId) {
        WastageRecord wastage = wastageRepo.findById(wastageId)
                .orElseThrow(() -> new RuntimeException("Wastage record not found"));
        wastage.setStatus(WastageRecord.WastageStatus.REJECTED);
        return InventoryDto.WastageResponse.from(wastageRepo.save(wastage));
    }

    // ── Transactions & Wastage lists ──────────────────────────────────────────
    public List<InventoryDto.TransactionResponse> getTransactions(Long branchId, String type) {
        List<StockTransaction> txs = type != null && !type.isBlank()
                ? txRepo.findByBranchIdAndTypeOrderByCreatedAtDesc(
                branchId, StockTransaction.TransactionType.valueOf(type.toUpperCase()))
                : txRepo.findByBranchIdOrderByCreatedAtDesc(branchId);
        return txs.stream().map(InventoryDto.TransactionResponse::from).collect(Collectors.toList());
    }

    public List<InventoryDto.WastageResponse> getWastage(Long branchId, String status) {
        List<WastageRecord> records = status != null && !status.isBlank()
                ? wastageRepo.findByBranchIdAndStatusOrderByCreatedAtDesc(
                branchId, WastageRecord.WastageStatus.valueOf(status.toUpperCase()))
                : wastageRepo.findByBranchIdOrderByCreatedAtDesc(branchId);
        return records.stream().map(InventoryDto.WastageResponse::from).collect(Collectors.toList());
    }

    private UserDetailsImpl getCaller() {
        return (UserDetailsImpl) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
    }
}