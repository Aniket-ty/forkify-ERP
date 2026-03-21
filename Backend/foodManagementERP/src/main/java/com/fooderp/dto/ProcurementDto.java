package com.fooderp.dto;

import com.fooderp.entity.*;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class ProcurementDto {

    // ══════════════════════════════════════════════════════════════════════════
    // SUPPLIER
    // ══════════════════════════════════════════════════════════════════════════

    @Data
    public static class SupplierRequest {
        @NotBlank(message = "Supplier name is required")
        private String name;
        private String contactPerson;
        private String phone;
        private String email;
        private String address;
        private String category;
        private String paymentTerms;
        private boolean hqApproved = false;
        private String notes;
    }

    @Data
    public static class SupplierResponse {
        private Long   id;
        private String name;
        private String contactPerson;
        private String phone;
        private String email;
        private String address;
        private String category;
        private String paymentTerms;
        private BigDecimal rating;
        private Integer totalOrders;
        private boolean hqApproved;
        private Long   branchId;
        private String branchName;
        private String status;
        private String notes;
        private String createdAt;

        public static SupplierResponse from(Supplier s) {
            SupplierResponse r = new SupplierResponse();
            r.id            = s.getId();
            r.name          = s.getName();
            r.contactPerson = s.getContactPerson();
            r.phone         = s.getPhone();
            r.email         = s.getEmail();
            r.address       = s.getAddress();
            r.category      = s.getCategory();
            r.paymentTerms  = s.getPaymentTerms();
            r.rating        = s.getRating();
            r.totalOrders   = s.getTotalOrders();
            r.hqApproved    = s.isHqApproved();
            r.branchId      = s.getBranch() != null ? s.getBranch().getId()   : null;
            r.branchName    = s.getBranch() != null ? s.getBranch().getName() : "HQ";
            r.status        = s.getStatus().name();
            r.notes         = s.getNotes();
            r.createdAt     = s.getCreatedAt() != null ? s.getCreatedAt().toString() : null;
            return r;
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // MATERIAL INDENT
    // ══════════════════════════════════════════════════════════════════════════

    @Data
    public static class IndentRequest {
        private String notes;
        @NotEmpty(message = "At least one item is required")
        private List<IndentItemRequest> items = new ArrayList<>();
    }

    @Data
    public static class IndentItemRequest {
        @NotNull
        private Long   ingredientId;
        @Positive
        private Double quantity;
        private String notes;
    }

    @Data
    public static class IndentResponse {
        private Long   id;
        private String indentNumber;
        private Long   branchId;
        private String branchName;
        private String status;
        private String notes;
        private String rejectionReason;
        private String raisedBy;
        private String approvedBy;
        private String approvedAt;
        private Long   purchaseOrderId;
        private String poNumber;
        private List<IndentItemResponse> items;
        private String createdAt;
        private String updatedAt;

        public static IndentResponse from(MaterialIndent i) {
            IndentResponse r = new IndentResponse();
            r.id             = i.getId();
            r.indentNumber   = i.getIndentNumber();
            r.branchId       = i.getBranch().getId();
            r.branchName     = i.getBranch().getName();
            r.status         = i.getStatus().name();
            r.notes          = i.getNotes();
            r.rejectionReason = i.getRejectionReason();
            r.raisedBy       = i.getRaisedBy()   != null ? i.getRaisedBy().getUsername()   : null;
            r.approvedBy     = i.getApprovedBy() != null ? i.getApprovedBy().getUsername() : null;
            r.approvedAt     = i.getApprovedAt() != null ? i.getApprovedAt().toString()    : null;
            r.purchaseOrderId = i.getPurchaseOrder() != null ? i.getPurchaseOrder().getId()       : null;
            r.poNumber        = i.getPurchaseOrder() != null ? i.getPurchaseOrder().getPoNumber() : null;
            r.items          = i.getItems().stream().map(IndentItemResponse::from).collect(Collectors.toList());
            r.createdAt      = i.getCreatedAt() != null ? i.getCreatedAt().toString() : null;
            r.updatedAt      = i.getUpdatedAt() != null ? i.getUpdatedAt().toString() : null;
            return r;
        }
    }

    @Data
    public static class IndentItemResponse {
        private Long   id;
        private Long   ingredientId;
        private String ingredientName;
        private String unit;
        private Double quantity;
        private String notes;

        public static IndentItemResponse from(IndentItem item) {
            IndentItemResponse r = new IndentItemResponse();
            r.id             = item.getId();
            r.ingredientId   = item.getIngredient().getId();
            r.ingredientName = item.getIngredient().getName();
            r.unit           = item.getIngredient().getUnit();
            r.quantity       = item.getQuantity();
            r.notes          = item.getNotes();
            return r;
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // PURCHASE ORDER
    // ══════════════════════════════════════════════════════════════════════════

    @Data
    public static class PORequest {
        @NotNull(message = "Supplier ID is required")
        private Long   supplierId;
        private String expectedDate; // yyyy-MM-dd
        private String notes;
        @NotEmpty(message = "At least one item is required")
        private List<POItemRequest> items = new ArrayList<>();
    }

    @Data
    public static class POItemRequest {
        @NotNull
        private Long       ingredientId;
        @Positive
        private Double     quantity;
        @PositiveOrZero
        private BigDecimal unitPrice = BigDecimal.ZERO;
        private String     notes;
    }

    @Data
    public static class POResponse {
        private Long       id;
        private String     poNumber;
        private Long       branchId;
        private String     branchName;
        private Long       supplierId;
        private String     supplierName;
        private String     supplierPhone;
        private String     status;
        private BigDecimal totalAmount;
        private String     expectedDate;
        private String     notes;
        private String     createdBy;
        private List<POItemResponse> items;
        private String     createdAt;
        private String     updatedAt;

        public static POResponse from(PurchaseOrder po) {
            POResponse r = new POResponse();
            r.id           = po.getId();
            r.poNumber     = po.getPoNumber();
            r.branchId     = po.getBranch().getId();
            r.branchName   = po.getBranch().getName();
            r.supplierId   = po.getSupplier().getId();
            r.supplierName = po.getSupplier().getName();
            r.supplierPhone = po.getSupplier().getPhone();
            r.status       = po.getStatus().name();
            r.totalAmount  = po.getTotalAmount();
            r.expectedDate = po.getExpectedDate() != null ? po.getExpectedDate().toString() : null;
            r.notes        = po.getNotes();
            r.createdBy    = po.getCreatedBy() != null ? po.getCreatedBy().getUsername() : null;
            r.items        = po.getItems().stream().map(POItemResponse::from).collect(Collectors.toList());
            r.createdAt    = po.getCreatedAt() != null ? po.getCreatedAt().toString() : null;
            r.updatedAt    = po.getUpdatedAt() != null ? po.getUpdatedAt().toString() : null;
            return r;
        }
    }

    @Data
    public static class POItemResponse {
        private Long       id;
        private Long       ingredientId;
        private String     ingredientName;
        private String     unit;
        private Double     quantity;
        private BigDecimal unitPrice;
        private BigDecimal totalPrice;
        private Double     receivedQuantity;
        private String     notes;

        public static POItemResponse from(POItem item) {
            POItemResponse r = new POItemResponse();
            r.id               = item.getId();
            r.ingredientId     = item.getIngredient().getId();
            r.ingredientName   = item.getIngredient().getName();
            r.unit             = item.getIngredient().getUnit();
            r.quantity         = item.getQuantity();
            r.unitPrice        = item.getUnitPrice();
            r.totalPrice       = item.getTotalPrice();
            r.receivedQuantity = item.getReceivedQuantity();
            r.notes            = item.getNotes();
            return r;
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // GOODS RECEIVED NOTE
    // ══════════════════════════════════════════════════════════════════════════

    @Data
    public static class GRNRequest {
        @NotNull(message = "PO ID is required")
        private Long   purchaseOrderId;
        private String receivedDate; // yyyy-MM-dd
        private String receivedBy;
        private String notes;
        @NotEmpty(message = "At least one item is required")
        private List<GRNItemRequest> items = new ArrayList<>();
    }

    @Data
    public static class GRNItemRequest {
        @NotNull
        private Long       ingredientId;
        @Positive
        private Double     receivedQuantity;
        private Double     orderedQuantity;
        private BigDecimal unitPrice;
        private String     expiryDate; // yyyy-MM-dd
        private String     notes;
    }

    @Data
    public static class GRNResponse {
        private Long   id;
        private String grnNumber;
        private Long   purchaseOrderId;
        private String poNumber;
        private String supplierName;
        private Long   branchId;
        private String branchName;
        private String status;
        private String receivedDate;
        private String receivedBy;
        private String notes;
        private String confirmedBy;
        private String confirmedAt;
        private List<GRNItemResponse> items;
        private String createdAt;

        public static GRNResponse from(GoodsReceived g) {
            GRNResponse r = new GRNResponse();
            r.id              = g.getId();
            r.grnNumber       = g.getGrnNumber();
            r.purchaseOrderId = g.getPurchaseOrder().getId();
            r.poNumber        = g.getPurchaseOrder().getPoNumber();
            r.supplierName    = g.getPurchaseOrder().getSupplier().getName();
            r.branchId        = g.getBranch().getId();
            r.branchName      = g.getBranch().getName();
            r.status          = g.getStatus().name();
            r.receivedDate    = g.getReceivedDate() != null ? g.getReceivedDate().toString() : null;
            r.receivedBy      = g.getReceivedBy();
            r.notes           = g.getNotes();
            r.confirmedBy     = g.getConfirmedBy() != null ? g.getConfirmedBy().getUsername() : null;
            r.confirmedAt     = g.getConfirmedAt() != null ? g.getConfirmedAt().toString() : null;
            r.items           = g.getItems().stream().map(GRNItemResponse::from).collect(Collectors.toList());
            r.createdAt       = g.getCreatedAt() != null ? g.getCreatedAt().toString() : null;
            return r;
        }
    }

    @Data
    public static class GRNItemResponse {
        private Long       id;
        private Long       ingredientId;
        private String     ingredientName;
        private String     unit;
        private Double     orderedQuantity;
        private Double     receivedQuantity;
        private BigDecimal unitPrice;
        private String     expiryDate;
        private String     notes;

        public static GRNItemResponse from(GRNItem item) {
            GRNItemResponse r = new GRNItemResponse();
            r.id               = item.getId();
            r.ingredientId     = item.getIngredient().getId();
            r.ingredientName   = item.getIngredient().getName();
            r.unit             = item.getIngredient().getUnit();
            r.orderedQuantity  = item.getOrderedQuantity();
            r.receivedQuantity = item.getReceivedQuantity();
            r.unitPrice        = item.getUnitPrice();
            r.expiryDate       = item.getExpiryDate() != null ? item.getExpiryDate().toString() : null;
            r.notes            = item.getNotes();
            return r;
        }
    }
}
