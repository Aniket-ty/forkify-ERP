package com.fooderp.controller;

import com.fooderp.entity.FinishedGoodStock;
import com.fooderp.repository.FinishedGoodStockRepository;
import com.fooderp.service.MenuService;
import com.fooderp.service.SalesService;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/menus")
@CrossOrigin(origins = "*")
public class MenuController {

    @Autowired private MenuService                 menuService;
    @Autowired private FinishedGoodStockRepository fgStockRepo;
    @Autowired private SalesService                salesService;

    // ── GET /api/menus ────────────────────────────────────────────────────────
    @GetMapping
    public ResponseEntity<?> getAll(
            @RequestParam(defaultValue = "false") boolean activeOnly) {
        return ResponseEntity.ok(
                activeOnly ? menuService.getActiveMenus() : menuService.getAllMenus());
    }

    // ── GET /api/menus/{id} ───────────────────────────────────────────────────
    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(menuService.getById(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // ── POST /api/menus ───────────────────────────────────────────────────────
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> create(@RequestBody MenuService.MenuRequest req) {
        try {
            return ResponseEntity.ok(menuService.create(req));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ── PUT /api/menus/{id} ───────────────────────────────────────────────────
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> update(@PathVariable Long id,
                                    @RequestBody MenuService.MenuRequest req) {
        try {
            return ResponseEntity.ok(menuService.update(id, req));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ── PUT /api/menus/{id}/activate ─────────────────────────────────────────
    @PutMapping("/{id}/activate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> activate(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(menuService.setActive(id, true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ── PUT /api/menus/{id}/deactivate ───────────────────────────────────────
    @PutMapping("/{id}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deactivate(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(menuService.setActive(id, false));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ── POST /api/menus/{id}/push ─────────────────────────────────────────────
    @PostMapping("/{id}/push")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> push(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(menuService.pushToBranches(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ── DELETE /api/menus/{id} ────────────────────────────────────────────────
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        menuService.delete(id);
        return ResponseEntity.ok("Menu deleted");
    }

    // ── GET /api/menus/{id}/pricing?branchId= ────────────────────────────────
    @GetMapping("/{id}/pricing")
    public ResponseEntity<?> getBranchPricing(@PathVariable Long id,
                                               @RequestParam Long branchId) {
        return ResponseEntity.ok(menuService.getBranchPricing(id, branchId));
    }

    // ── PUT /api/menus/items/{itemId}/pricing?branchId= ──────────────────────
    @PutMapping("/items/{itemId}/pricing")
    public ResponseEntity<?> saveBranchPrice(
            @PathVariable Long itemId,
            @RequestParam Long branchId,
            @RequestParam(required = false) BigDecimal price,
            @RequestParam(defaultValue = "true") boolean available) {
        try {
            return ResponseEntity.ok(
                    menuService.saveBranchPrice(itemId, branchId, price, available));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // PUBLIC QR MENU ENDPOINTS — NO AUTH REQUIRED
    // Add to SecurityConfig.java filterChain:
    //   .requestMatchers("/api/menus/public/**").permitAll()
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * GET /api/menus/public/{menuId}?branchId={branchId}
     *
     * Returns all menu items annotated with real-time stock status.
     * - inStock = true  when FinishedGoodStock.availableServings > 0 for this branch
     * - inStock = false shows item as OUT OF STOCK but still orderable (fresh prep)
     *
     * No JWT required — called from the public QR page scanned by customers.
     */
    @GetMapping("/public/{menuId}")
    public ResponseEntity<?> getPublicMenu(@PathVariable Long menuId,
                                            @RequestParam Long branchId) {
        try {
            MenuService.MenuResponse menu = menuService.getById(menuId);

            // Build recipeId -> availableServings map for this branch
            List<FinishedGoodStock> stocks =
                    fgStockRepo.findByBranchIdOrderByRecipeNameAsc(branchId);

            Map<Long, Integer> stockMap = stocks.stream().collect(
                    Collectors.toMap(
                            fg -> fg.getRecipe().getId(),
                            FinishedGoodStock::getAvailableServings,
                            (existing, replacement) -> existing
                    ));

            // Annotate each item with stock info
            List<PublicMenuItem> publicItems = menu.getItems().stream()
                    .map(item -> {
                        Integer available = stockMap.get(item.getRecipeId());
                        int servings = available != null ? available : 0;

                        PublicMenuItem pm = new PublicMenuItem();
                        pm.setMenuItemId(item.getId());
                        pm.setRecipeId(item.getRecipeId());
                        pm.setName(item.getDisplayName() != null
                                ? item.getDisplayName()
                                : item.getRecipeName());
                        pm.setDescription(item.getDescription());
                        pm.setMenuCategory(item.getMenuCategory());
                        pm.setBasePrice(item.getBasePrice());
                        // calories come from the recipe nutrition fields on MenuItemResponse
                        pm.setCalories(item.getCalories());
                        pm.setAvailableServings(servings);
                        pm.setInStock(servings > 0);
                        return pm;
                    })
                    .collect(Collectors.toList());

            PublicMenuResponse response = new PublicMenuResponse();
            response.setMenuId(menu.getId());
            response.setMenuName(menu.getName());
            response.setDescription(menu.getDescription());
            response.setSeason(menu.getSeason());
            response.setBranchId(branchId);
            response.setItems(publicItems);

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * POST /api/menus/public/order
     *
     * Places a sales order from the public QR menu page (no auth).
     * Creates SalesEntry rows tagged "[QR-ORDER:QR-YYYYMMDD-XXXX]" in the notes field.
     *
     * Does NOT deduct FinishedGoodStock.
     * Kitchen staff must Log Production -> raw materials deducted -> FG stock added.
     *
     * These orders appear in ERP Daily Sales -> QROrdersPanel.
     */
    @PostMapping("/public/order")
    public ResponseEntity<?> placePublicOrder(@RequestBody PublicOrderRequest req) {
        try {
            if (req.getBranchId() == null) {
                return ResponseEntity.badRequest().body("branchId is required");
            }
            if (req.getItems() == null || req.getItems().isEmpty()) {
                return ResponseEntity.badRequest().body("At least one item is required");
            }
            PublicOrderResponse response = salesService.placePublicMenuOrder(req);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ── Public endpoint DTOs ──────────────────────────────────────────────────

    @Data
    public static class PublicMenuItem {
        private Long       menuItemId;
        private Long       recipeId;
        private String     name;
        private String     description;
        private String     menuCategory;
        private BigDecimal basePrice;
        private Double     calories;


        private Integer    availableServings;
        private boolean    inStock;
    }

    @Data
    public static class PublicMenuResponse {
        private Long                 menuId;
        private String               menuName;
        private String               description;
        private String               season;
        private Long                 branchId;
        private List<PublicMenuItem> items;
    }

    @Data
    public static class PublicOrderRequest {
        private Long                  branchId;
        private Long                  menuId;
        private String                tableNumber;
        private String                customerName;
        private String                customerPhone;
        private String                notes;
        private List<PublicOrderItem> items;
    }

    @Data
    public static class PublicOrderItem {
        private Long       recipeId;
        private Long       menuItemId;
        private Integer    quantity;
        private BigDecimal unitPrice;
    }

    @Data
    public static class PublicOrderResponse {
        private String                orderNumber;
        private Long                  branchId;
        private String                status;
        private String                message;
        private BigDecimal            totalAmount;
        private List<PublicOrderItem> items;
        private LocalDateTime         createdAt;
        // Customer info — set when phone was provided
        private Long                  customerId;
        private String                customerName;
        private Integer               currentLoyaltyPoints;
        private String                customerTier;
        private boolean               newCustomer;   // true if auto-created during this order
    }
}
