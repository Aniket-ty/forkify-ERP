package com.fooderp.controller;

import com.fooderp.entity.WastageRecord;
import com.fooderp.repository.*;
import com.fooderp.security.UserDetailsImpl;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * NotificationController
 *
 * Returns real-time alert notifications derived from live data:
 *   - Low stock items (inventory below minimum level)
 *   - Items expiring within 3 days
 *   - Pending wastage approvals
 *   - Purchase orders awaiting action
 *
 * GET /api/notifications?branchId=
 */
@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "*")
public class NotificationController {

    @Autowired private InventoryItemRepository  inventoryRepo;
    @Autowired private WastageRecordRepository  wastageRepo;
    @Autowired private PurchaseOrderRepository  poRepo;

    private Long resolveBranch(Authentication auth, Long branchId) {
        UserDetailsImpl u = (UserDetailsImpl) auth.getPrincipal();
        boolean isAdmin = u.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        return (isAdmin && branchId != null) ? branchId : u.getBranchId();
    }

    @GetMapping
    public ResponseEntity<?> getNotifications(
            @RequestParam(required = false) Long branchId,
            Authentication auth) {

        Long bid = resolveBranch(auth, branchId);
        if (bid == null) return ResponseEntity.ok(Collections.emptyList());

        List<NotificationItem> notifications = new ArrayList<>();

        // ── 1. Critical stock alerts ─────────────────────────────────────────
        inventoryRepo.findLowStockByBranch(bid).stream()
                .filter(i -> i.getStockStatus() == com.fooderp.entity.InventoryItem.StockStatus.CRITICAL
                        || i.getStockStatus() == com.fooderp.entity.InventoryItem.StockStatus.OUT_OF_STOCK)
                .limit(5)
                .forEach(item -> {
                    NotificationItem n = new NotificationItem();
                    n.setId("stock_critical_" + item.getId());
                    n.setType("danger");
                    n.setText(item.getIngredient().getName() + " is critically low ("
                            + item.getCurrentQuantity() + " " + item.getIngredient().getUnit()
                            + " remaining)");
                    n.setLink("/fooderp/inventory/raw-materials");
                    n.setTime(formatTime(item.getLastUpdated()));
                    n.setCategory("inventory");
                    notifications.add(n);
                });

        // ── 2. Low stock warnings ─────────────────────────────────────────────
        inventoryRepo.findLowStockByBranch(bid).stream()
                .filter(i -> i.getStockStatus() == com.fooderp.entity.InventoryItem.StockStatus.LOW)
                .limit(3)
                .forEach(item -> {
                    NotificationItem n = new NotificationItem();
                    n.setId("stock_low_" + item.getId());
                    n.setType("warning");
                    n.setText(item.getIngredient().getName() + " is running low ("
                            + item.getCurrentQuantity() + " / " + item.getMinStockLevel()
                            + " " + item.getIngredient().getUnit() + ")");
                    n.setLink("/fooderp/inventory/raw-materials");
                    n.setTime(formatTime(item.getLastUpdated()));
                    n.setCategory("inventory");
                    notifications.add(n);
                });

        // ── 3. Expiring soon (3 days) ─────────────────────────────────────────
        inventoryRepo.findExpiringByBranch(bid, LocalDate.now().plusDays(3))
                .stream().limit(3)
                .forEach(item -> {
                    long daysLeft = java.time.temporal.ChronoUnit.DAYS.between(
                            LocalDate.now(), item.getExpiryDate());
                    NotificationItem n = new NotificationItem();
                    n.setId("expiry_" + item.getId());
                    n.setType(daysLeft <= 1 ? "danger" : "warning");
                    n.setText(item.getIngredient().getName() + " expires in "
                            + (daysLeft == 0 ? "today" : daysLeft + " day" + (daysLeft == 1 ? "" : "s")));
                    n.setLink("/fooderp/inventory/raw-materials");
                    n.setTime("Expires " + item.getExpiryDate());
                    n.setCategory("expiry");
                    notifications.add(n);
                });

        // ── 4. Pending wastage approvals ──────────────────────────────────────
        long pendingWastage = wastageRepo.countPendingByBranch(bid);
        if (pendingWastage > 0) {
            NotificationItem n = new NotificationItem();
            n.setId("wastage_pending");
            n.setType("warning");
            n.setText(pendingWastage + " wastage record" + (pendingWastage == 1 ? "" : "s")
                    + " awaiting approval");
            n.setLink("/fooderp/inventory/wastage");
            n.setTime("Pending approval");
            n.setCategory("wastage");
            notifications.add(n);
        }

        // ── 5. Purchase orders needing action ─────────────────────────────────
        long draftPOs = poRepo.findByBranchIdOrderByCreatedAtDesc(bid).stream()
                .filter(p -> p.getStatus() == com.fooderp.entity.PurchaseOrder.POStatus.DRAFT)
                .count();
        if (draftPOs > 0) {
            NotificationItem n = new NotificationItem();
            n.setId("po_draft");
            n.setType("info");
            n.setText(draftPOs + " purchase order" + (draftPOs == 1 ? "" : "s")
                    + " in draft — send to supplier");
            n.setLink("/fooderp/procurement/orders");
            n.setTime("Action required");
            n.setCategory("procurement");
            notifications.add(n);
        }

        // Sort: danger first, then warning, then info
        notifications.sort((a, b) -> {
            int orderA = "danger".equals(a.getType()) ? 0 : "warning".equals(a.getType()) ? 1 : 2;
            int orderB = "danger".equals(b.getType()) ? 0 : "warning".equals(b.getType()) ? 1 : 2;
            return Integer.compare(orderA, orderB);
        });

        return ResponseEntity.ok(notifications);
    }

    private String formatTime(java.time.LocalDateTime ldt) {
        if (ldt == null) return "Recently";
        long minutes = java.time.temporal.ChronoUnit.MINUTES.between(ldt, LocalDateTime.now());
        if (minutes < 1)  return "Just now";
        if (minutes < 60) return minutes + " min ago";
        long hours = minutes / 60;
        if (hours < 24)   return hours + " hr ago";
        return (hours / 24) + " days ago";
    }

    @Data
    public static class NotificationItem {
        private String id;
        private String type;     // danger | warning | info | success
        private String text;
        private String link;
        private String time;
        private String category; // inventory | expiry | wastage | procurement
    }
}