package com.fooderp.dto;

import com.fooderp.entity.*;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

public class InventoryDto {

    // ── Inventory Item response ───────────────────────────────────────────────
    @Data
    public static class ItemResponse {
        private Long   id;
        private Long   ingredientId;
        private String ingredientName;
        private String category;
        private String unit;
        private Double currentQuantity;
        private Double minStockLevel;
        private String location;
        private BigDecimal unitCost;
        private BigDecimal totalValue;
        private String expiryDate;
        private String status;
        private Long   branchId;
        private String lastUpdated;

        public static ItemResponse from(InventoryItem item) {
            ItemResponse r = new ItemResponse();
            r.id              = item.getId();
            r.ingredientId    = item.getIngredient().getId();
            r.ingredientName  = item.getIngredient().getName();
            r.category        = item.getIngredient().getCategory();
            r.unit            = item.getIngredient().getUnit();
            r.currentQuantity = item.getCurrentQuantity();
            r.minStockLevel   = item.getMinStockLevel();
            r.location        = item.getLocation();
            r.unitCost        = item.getEffectiveUnitCost();
            r.totalValue      = item.getTotalValue();
            r.expiryDate      = item.getExpiryDate() != null ? item.getExpiryDate().toString() : null;
            r.status          = item.getStockStatus().name();
            r.branchId        = item.getBranch().getId();
            r.lastUpdated     = item.getLastUpdated() != null ? item.getLastUpdated().toString() : null;
            return r;
        }
    }

    // ── Create / update inventory item ────────────────────────────────────────
    @Data
    public static class ItemRequest {
        @NotNull(message = "Ingredient ID is required")
        private Long ingredientId;
        @PositiveOrZero private Double currentQuantity = 0.0;
        @PositiveOrZero private Double minStockLevel   = 0.0;
        private String     location;
        private BigDecimal unitCost;
        private String     expiryDate;
    }

    // ── Stock-In request ──────────────────────────────────────────────────────
    @Data
    public static class StockInRequest {
        @NotNull private Long   ingredientId;
        @Positive private Double quantity;
        private String     supplier;
        private String     referenceNo;
        private BigDecimal unitCost;
        private String     expiryDate;
        private String     notes;
    }

    // ── Wastage request — supports INGREDIENT and FINISHED_PRODUCT ────────────
    @Data
    public static class WastageRequest {
        // "INGREDIENT" (default) or "FINISHED_PRODUCT"
        private String wastageType;

        // For INGREDIENT wastage
        private Long   ingredientId;

        // For FINISHED_PRODUCT wastage
        private Long   recipeId;

        @Positive(message = "Quantity must be positive")
        private Double quantity;

        @NotNull(message = "Reason is required")
        private String reason;

        private String referenceNo;
        private String notes;
    }

    // ── Stock transaction response ────────────────────────────────────────────
    @Data
    public static class TransactionResponse {
        private Long   id;
        private String ingredientName;
        private String type;
        private Double quantity;
        private String unit;
        private BigDecimal unitCost;
        private Double balanceAfter;
        private String referenceNo;
        private String supplier;
        private String notes;
        private String transactionDate;
        private String createdBy;
        private String createdAt;

        public static TransactionResponse from(StockTransaction t) {
            TransactionResponse r = new TransactionResponse();
            r.id              = t.getId();
            r.ingredientName  = t.getIngredient().getName();
            r.type            = t.getType().name();
            r.quantity        = t.getQuantity();
            r.unit            = t.getIngredient().getUnit();
            r.unitCost        = t.getUnitCost();
            r.balanceAfter    = t.getBalanceAfter();
            r.referenceNo     = t.getReferenceNo();
            r.supplier        = t.getSupplier();
            r.notes           = t.getNotes();
            r.transactionDate = t.getTransactionDate() != null ? t.getTransactionDate().toString() : null;
            r.createdBy       = t.getCreatedBy() != null ? t.getCreatedBy().getUsername() : null;
            r.createdAt       = t.getCreatedAt()  != null ? t.getCreatedAt().toString()  : null;
            return r;
        }
    }

    // ── Wastage record response — includes type + recipe or ingredient ─────────
    @Data
    public static class WastageResponse {
        private Long   id;
        private String wastageType;    // INGREDIENT or FINISHED_PRODUCT
        private String ingredientName; // populated when wastageType = INGREDIENT
        private String recipeName;     // populated when wastageType = FINISHED_PRODUCT
        private String unit;
        private Double quantity;
        private String reason;
        private BigDecimal costLoss;
        private String referenceNo;
        private String notes;
        private String status;
        private String loggedBy;
        private String approvedBy;
        private String wastageDate;
        private String createdAt;

        public static WastageResponse from(WastageRecord w) {
            WastageResponse r = new WastageResponse();
            r.id          = w.getId();
            r.wastageType = w.getWastageType() != null ? w.getWastageType().name() : "INGREDIENT";

            if (w.getWastageType() == WastageRecord.WastageType.FINISHED_PRODUCT && w.getRecipe() != null) {
                r.recipeName = w.getRecipe().getName();
                r.unit       = "servings";
            } else if (w.getIngredient() != null) {
                r.ingredientName = w.getIngredient().getName();
                r.unit           = w.getIngredient().getUnit();
            }

            r.quantity    = w.getQuantity();
            r.reason      = w.getReason().name();
            r.costLoss    = w.getCostLoss();
            r.referenceNo = w.getReferenceNo();
            r.notes       = w.getNotes();
            r.status      = w.getStatus().name();
            r.loggedBy    = w.getLoggedBy()   != null ? w.getLoggedBy().getUsername()   : null;
            r.approvedBy  = w.getApprovedBy() != null ? w.getApprovedBy().getUsername() : null;
            r.wastageDate = w.getWastageDate() != null ? w.getWastageDate().toString()  : null;
            r.createdAt   = w.getCreatedAt()   != null ? w.getCreatedAt().toString()    : null;
            return r;
        }
    }

    // ── Dashboard summary ─────────────────────────────────────────────────────
    @Data
    public static class Summary {
        private long       totalItems;
        private long       lowStockCount;
        private long       expiringCount;
        private long       pendingWastage;
        private BigDecimal totalValue;
    }

    // ── Finished Good Stock response ──────────────────────────────────────────
    @Data
    public static class FinishedStockResponse {
        private Long   id;
        private Long   recipeId;
        private String recipeName;
        private String recipeCategory;
        private Integer availableServings;
        private Integer totalProduced;
        private Integer totalSold;
        private Integer totalWasted;
        private BigDecimal costPerServing;
        private String lastProducedDate;

        public static FinishedStockResponse from(FinishedGoodStock f) {
            FinishedStockResponse r = new FinishedStockResponse();
            r.id               = f.getId();
            r.recipeId         = f.getRecipe().getId();
            r.recipeName       = f.getRecipe().getName();
            r.recipeCategory   = f.getRecipe().getCategory();
            r.availableServings = f.getAvailableServings();
            r.totalProduced    = f.getTotalProduced();
            r.totalSold        = f.getTotalSold();
            r.totalWasted      = f.getTotalWasted();
            r.costPerServing   = f.getCostPerServing();
            r.lastProducedDate = f.getLastProducedDate() != null ? f.getLastProducedDate().toString() : null;
            return r;
        }
    }
}