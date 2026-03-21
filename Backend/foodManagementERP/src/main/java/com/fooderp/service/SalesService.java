package com.fooderp.service;

import com.fooderp.controller.MenuController;
import com.fooderp.entity.*;
import com.fooderp.repository.*;
import com.fooderp.security.UserDetailsImpl;
import jakarta.transaction.Transactional;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class SalesService {

    @Autowired private SalesEntryRepository       salesRepo;
    @Autowired private RecipeRepository            recipeRepo;
    @Autowired private MenuItemRepository          menuItemRepo;
    @Autowired private BranchRepository            branchRepo;
    @Autowired private UserRepository              userRepo;
    @Autowired private BranchMenuPriceRepository   priceRepo;
    @Autowired private CustomerRepository          customerRepo;
    @Autowired private FinishedGoodStockRepository fgStockRepo;

    // ─────────────────────────────────────────────────────────────────────────
    // Log a sale — deducts FinishedGoodStock + links customer + awards points
    // ─────────────────────────────────────────────────────────────────────────
    public SalesResponse logSales(Long branchId, SalesRequest req) {
        UserDetailsImpl caller = getCaller();
        Branch branch = branchRepo.findById(branchId)
                .orElseThrow(() -> new RuntimeException("Branch not found"));
        Recipe recipe = recipeRepo.findById(req.getRecipeId())
                .orElseThrow(() -> new RuntimeException("Recipe not found"));

        SalesEntry entry = new SalesEntry();
        entry.setBranch(branch);
        entry.setRecipe(recipe);
        entry.setQuantitySold(req.getQuantitySold());
        entry.setSaleDate(req.getSaleDate() != null
                ? LocalDate.parse(req.getSaleDate()) : LocalDate.now());
        entry.setNotes(req.getNotes());

        // Resolve selling price
        BigDecimal price = req.getSellingPrice();
        if (price == null && req.getMenuItemId() != null) {
            price = priceRepo.findByMenuItemIdAndBranchId(req.getMenuItemId(), branchId)
                    .map(p -> p.getCustomPrice() != null
                            ? p.getCustomPrice()
                            : p.getMenuItem().getBasePrice())
                    .orElse(BigDecimal.ZERO);
            menuItemRepo.findById(req.getMenuItemId()).ifPresent(entry::setMenuItem);
        }
        entry.setSellingPrice(price != null ? price : BigDecimal.ZERO);
        entry.setTotalRevenue(entry.getSellingPrice()
                .multiply(BigDecimal.valueOf(req.getQuantitySold()))
                .setScale(2, RoundingMode.HALF_UP));

        // Cost of goods
        BigDecimal cost = recipe.getIngredients().stream()
                .map(ri -> ri.getIngredient().getCostPerUnit()
                        .multiply(BigDecimal.valueOf(ri.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal cogs = recipe.getServings() > 0
                ? cost.divide(BigDecimal.valueOf(recipe.getServings()), 4, RoundingMode.HALF_UP)
                      .multiply(BigDecimal.valueOf(req.getQuantitySold()))
                      .setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
        entry.setCostOfGoods(cogs);

        // Deduct from FinishedGoodStock
        fgStockRepo.findByRecipeIdAndBranchId(recipe.getId(), branchId)
                .ifPresent(fg -> {
                    int newAvailable = Math.max(0, fg.getAvailableServings() - req.getQuantitySold());
                    fg.setAvailableServings(newAvailable);
                    fg.setTotalSold(fg.getTotalSold() + req.getQuantitySold());
                    fgStockRepo.save(fg);
                });

        // Customer link + loyalty points
        if (req.getCustomerId() != null) {
            customerRepo.findById(req.getCustomerId()).ifPresent(customer -> {
                entry.setCustomer(customer);
                int pts = entry.getTotalRevenue()
                        .divideToIntegralValue(BigDecimal.TEN).intValue();
                entry.setLoyaltyPointsAwarded(pts);
                customer.setVisitCount(customer.getVisitCount() + 1);
                customer.setLastVisit(entry.getSaleDate());
                customer.setTotalSpend(customer.getTotalSpend().add(entry.getTotalRevenue()));
                customer.setLoyaltyPoints(customer.getLoyaltyPoints() + pts);
                customerRepo.save(customer);
            });
        }

        userRepo.findById(caller.getId()).ifPresent(entry::setLoggedBy);
        return toResponse(salesRepo.save(entry));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Place a public QR menu order — called with NO authentication.
    //
    // Flow:
    //   1. Creates a SalesEntry per item, notes tagged "[QR-ORDER:QR-YYYYMMDD-XXXX]"
    //   2. Does NOT deduct FinishedGoodStock (kitchen produces on demand via Log Production)
    //   3. Returns an order summary shown to the customer on the QR page
    //
    // ERP staff action:
    //   Daily Sales → QROrdersPanel → "Log Production" per item
    //   → ProductionService deducts raw materials, adds to FinishedGoodStock
    // ─────────────────────────────────────────────────────────────────────────
    public MenuController.PublicOrderResponse placePublicMenuOrder(
            MenuController.PublicOrderRequest req) {

        Branch branch = branchRepo.findById(req.getBranchId())
                .orElseThrow(() -> new RuntimeException("Branch not found: " + req.getBranchId()));

        // Generate a unique order number: QR-20250320-4271
        String orderNumber = "QR-"
                + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"))
                + "-"
                + String.format("%04d", (int) (Math.random() * 9000) + 1000);

        // ── Resolve customer before the loop so each SalesEntry gets linked ───────
        // Phone provided + exists → use existing customer
        // Phone provided + new    → auto-create customer record
        // No phone                → anonymous (guest name stored in notes only)
        Customer resolvedCustomer = null;

        if (req.getCustomerPhone() != null && !req.getCustomerPhone().isBlank()) {
            String phone = req.getCustomerPhone().trim();
            java.util.Optional<Customer> existing = customerRepo.findByPhone(phone);

            if (existing.isPresent()) {
                resolvedCustomer = existing.get();
                resolvedCustomer.setLastVisit(LocalDate.now());
                resolvedCustomer.setVisitCount(resolvedCustomer.getVisitCount() + 1);
                resolvedCustomer = customerRepo.save(resolvedCustomer);
            } else {
                // Auto-create new customer from QR order details
                resolvedCustomer = new Customer();
                resolvedCustomer.setName(
                    req.getCustomerName() != null && !req.getCustomerName().isBlank()
                        ? req.getCustomerName()
                        : "Guest (" + phone + ")");
                resolvedCustomer.setPhone(phone);
                resolvedCustomer.setBranch(branch);
                resolvedCustomer.setLoyaltyPoints(0);
                resolvedCustomer.setTotalSpend(BigDecimal.ZERO);
                resolvedCustomer.setVisitCount(1);
                resolvedCustomer.setLastVisit(LocalDate.now());
                resolvedCustomer.setNotes("Auto-registered via QR menu");
                resolvedCustomer.setActive(true);
                resolvedCustomer = customerRepo.save(resolvedCustomer);
            }
        }

        BigDecimal totalAmount = BigDecimal.ZERO;
        List<MenuController.PublicOrderItem> processedItems = new ArrayList<>();

        for (MenuController.PublicOrderItem item : req.getItems()) {
            Recipe recipe = recipeRepo.findById(item.getRecipeId())
                    .orElseThrow(() -> new RuntimeException(
                            "Recipe not found: " + item.getRecipeId()));

            // Build notes string — includes order number, table, and guest name
            StringBuilder notes = new StringBuilder();
            notes.append("[QR-ORDER:").append(orderNumber).append("]");
            if (req.getTableNumber() != null && !req.getTableNumber().isBlank()) {
                notes.append(" Table:").append(req.getTableNumber());
            }
            if (req.getCustomerName() != null && !req.getCustomerName().isBlank()) {
                notes.append(" Guest:").append(req.getCustomerName());
            }
            if (req.getNotes() != null && !req.getNotes().isBlank()) {
                notes.append(" ").append(req.getNotes());
            }

            int qty = item.getQuantity() != null ? item.getQuantity() : 1;

            BigDecimal unitPrice = item.getUnitPrice() != null
                    ? item.getUnitPrice()
                    : BigDecimal.ZERO;

            BigDecimal lineRevenue = unitPrice
                    .multiply(BigDecimal.valueOf(qty))
                    .setScale(2, RoundingMode.HALF_UP);

            // Cost of goods estimate (recipe base cost ÷ servings × qty)
            BigDecimal rawCost = recipe.getIngredients().stream()
                    .map(ri -> ri.getIngredient().getCostPerUnit()
                            .multiply(BigDecimal.valueOf(ri.getQuantity())))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal cogs = recipe.getServings() > 0
                    ? rawCost
                        .divide(BigDecimal.valueOf(recipe.getServings()), 4, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(qty))
                        .setScale(2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;

            SalesEntry entry = new SalesEntry();
            entry.setBranch(branch);
            entry.setRecipe(recipe);
            entry.setQuantitySold(qty);
            entry.setSaleDate(LocalDate.now());
            entry.setNotes(notes.toString());
            entry.setSellingPrice(unitPrice);
            entry.setTotalRevenue(lineRevenue);
            entry.setCostOfGoods(cogs);

            // Link menu item if provided
            if (item.getMenuItemId() != null) {
                menuItemRepo.findById(item.getMenuItemId())
                        .ifPresent(entry::setMenuItem);
            }

            // NOTE: intentionally NOT deducting FinishedGoodStock here.
            // The kitchen must Log Production first, which deducts raw materials
            // and adds to FinishedGoodStock. The sale is then fulfilled from stock.

            // Link customer if resolved (no points yet — points come on fulfilment)
            if (resolvedCustomer != null) {
                entry.setCustomer(resolvedCustomer);
            }

            salesRepo.save(entry);

            totalAmount = totalAmount.add(lineRevenue);
            processedItems.add(item);
        }

        // Customer already resolved and linked above in the loop.

        MenuController.PublicOrderResponse response = new MenuController.PublicOrderResponse();
        response.setOrderNumber(orderNumber);
        response.setBranchId(req.getBranchId());
        response.setStatus("RECEIVED");
        response.setMessage("Order " + orderNumber + " received! Kitchen is being notified.");
        response.setTotalAmount(totalAmount);
        response.setItems(processedItems);
        response.setCreatedAt(LocalDateTime.now());

        // Populate customer info in response so the QR page can show loyalty details
        if (resolvedCustomer != null) {
            response.setCustomerId(resolvedCustomer.getId());
            response.setCustomerName(resolvedCustomer.getName());
            response.setCurrentLoyaltyPoints(resolvedCustomer.getLoyaltyPoints());
            int pts = resolvedCustomer.getLoyaltyPoints();
            response.setCustomerTier(pts >= 1000 ? "GOLD" : pts >= 500 ? "SILVER" : "BRONZE");
            response.setNewCustomer(
                req.getCustomerPhone() != null &&
                resolvedCustomer.getNotes() != null &&
                resolvedCustomer.getNotes().contains("Auto-registered via QR menu")
            );
        }

        return response;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Get sales history
    // ─────────────────────────────────────────────────────────────────────────
    public List<SalesResponse> getSales(Long branchId, String date) {
        if (date != null && !date.isBlank()) {
            return salesRepo.findByBranchIdAndSaleDateOrderByCreatedAtDesc(
                            branchId, LocalDate.parse(date))
                    .stream().map(this::toResponse).collect(Collectors.toList());
        }
        return salesRepo.findByBranchIdOrderBySaleDateDescCreatedAtDesc(branchId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Get sales by customer
    // ─────────────────────────────────────────────────────────────────────────
    public List<SalesResponse> getSalesByCustomer(Long customerId) {
        return salesRepo.findByCustomerIdOrderBySaleDateDesc(customerId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Summary for date range (dashboard / analytics)
    // ─────────────────────────────────────────────────────────────────────────
    public SalesSummary getSummary(Long branchId, LocalDate from, LocalDate to) {
        List<SalesEntry> entries = salesRepo.findByBranchAndDateRange(branchId, from, to);
        SalesSummary s = new SalesSummary();
        s.setTotalOrders(entries.size());
        s.setTotalRevenue(entries.stream()
                .map(SalesEntry::getTotalRevenue)
                .filter(v -> v != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP));
        s.setTotalCogs(entries.stream()
                .map(SalesEntry::getCostOfGoods)
                .filter(v -> v != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP));
        s.setGrossProfit(s.getTotalRevenue().subtract(s.getTotalCogs())
                .setScale(2, RoundingMode.HALF_UP));

        List<Object[]> topRaw = salesRepo.findTopRecipesByBranchAndDateRange(branchId, from, to);
        s.setTopRecipes(topRaw.stream().limit(5).map(row -> {
            TopRecipe tr = new TopRecipe();
            tr.setRecipeId((Long) row[0]);
            tr.setRecipeName((String) row[1]);
            tr.setQuantitySold(((Number) row[2]).intValue());
            tr.setRevenue(row[3] != null
                    ? ((BigDecimal) row[3]).setScale(2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO);
            return tr;
        }).collect(Collectors.toList()));

        return s;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────────────────────────────────────
    private SalesResponse toResponse(SalesEntry e) {
        SalesResponse r = new SalesResponse();
        r.setId(e.getId());
        r.setRecipeId(e.getRecipe().getId());
        r.setRecipeName(e.getRecipe().getName());
        r.setRecipeCategory(e.getRecipe().getCategory());
        r.setSaleDate(e.getSaleDate().toString());
        r.setQuantitySold(e.getQuantitySold());
        r.setSellingPrice(e.getSellingPrice());
        r.setTotalRevenue(e.getTotalRevenue());
        r.setCostOfGoods(e.getCostOfGoods());
        if (e.getTotalRevenue() != null && e.getCostOfGoods() != null
                && e.getTotalRevenue().compareTo(BigDecimal.ZERO) > 0) {
            r.setGrossProfit(e.getTotalRevenue().subtract(e.getCostOfGoods())
                    .setScale(2, RoundingMode.HALF_UP));
        }
        r.setNotes(e.getNotes());
        r.setLoggedBy(e.getLoggedBy() != null ? e.getLoggedBy().getUsername() : null);
        if (e.getCustomer() != null) {
            r.setCustomerId(e.getCustomer().getId());
            r.setCustomerName(e.getCustomer().getName());
            r.setCustomerPhone(e.getCustomer().getPhone());
        }
        r.setLoyaltyPointsAwarded(e.getLoyaltyPointsAwarded() != null
                ? e.getLoyaltyPointsAwarded() : 0);
        return r;
    }

    private UserDetailsImpl getCaller() {
        return (UserDetailsImpl) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DTOs
    // ─────────────────────────────────────────────────────────────────────────
    @Data
    public static class SalesRequest {
        private Long       recipeId;
        private Long       menuItemId;
        private Long       customerId;
        private Integer    quantitySold;
        private BigDecimal sellingPrice;
        private String     saleDate;
        private String     notes;
    }

    @Data
    public static class SalesResponse {
        private Long       id;
        private Long       recipeId;
        private String     recipeName;
        private String     recipeCategory;
        private String     saleDate;
        private String     notes;
        private String     loggedBy;
        private Integer    quantitySold;
        private BigDecimal sellingPrice;
        private BigDecimal totalRevenue;
        private BigDecimal costOfGoods;
        private BigDecimal grossProfit;
        private Long       customerId;
        private String     customerName;
        private String     customerPhone;
        private Integer    loyaltyPointsAwarded;
    }

    @Data
    public static class SalesSummary {
        private int        totalOrders;
        private BigDecimal totalRevenue;
        private BigDecimal totalCogs;
        private BigDecimal grossProfit;
        private List<TopRecipe> topRecipes = new ArrayList<>();
    }

    @Data
    public static class TopRecipe {
        private Long       recipeId;
        private String     recipeName;
        private int        quantitySold;
        private BigDecimal revenue;
    }
}
