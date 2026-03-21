package com.fooderp.service;

import com.fooderp.controller.DashboardController;
import com.fooderp.entity.PurchaseOrder;
import com.fooderp.entity.Recipe;
import com.fooderp.repository.*;
import com.fooderp.security.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class DashboardService {

    @Autowired private InventoryItemRepository inventoryRepo;
    @Autowired private SalesEntryRepository salesRepo;
    @Autowired private PurchaseOrderRepository poRepo;
    @Autowired private WastageRecordRepository wastageRepo;
    @Autowired private RecipeRepository recipeRepo;
    @Autowired private SupplierRepository supplierRepo;
    @Autowired private BranchRepository branchRepo;
    @Autowired private SalesService salesService;

    @Transactional(readOnly = true)
    public DashboardController.DashboardData getDashboard(Long branchId, Authentication auth) {

        UserDetailsImpl user = (UserDetailsImpl) auth.getPrincipal();

        boolean admin = user.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        Long bid = (admin && branchId != null) ? branchId : user.getBranchId();

        LocalDate today = LocalDate.now();
        LocalDate monthStart = today.withDayOfMonth(1);
        LocalDate lastMonthStart = monthStart.minusMonths(1);
        LocalDate lastMonthEnd = monthStart.minusDays(1);

        DashboardController.DashboardData data = new DashboardController.DashboardData();

        /*
        ─────────────────────────────
        REVENUE
        ─────────────────────────────
         */

        if (bid != null) {

            BigDecimal thisMonth =
                    salesRepo.sumRevenueByBranchAndDateRange(bid, monthStart, today);

            BigDecimal lastMonth =
                    salesRepo.sumRevenueByBranchAndDateRange(bid, lastMonthStart, lastMonthEnd);

            data.setTotalRevenue(Optional.ofNullable(thisMonth).orElse(BigDecimal.ZERO));
            data.setLastMonthRevenue(Optional.ofNullable(lastMonth).orElse(BigDecimal.ZERO));
        }

        /*
        ─────────────────────────────
        INVENTORY
        ─────────────────────────────
         */

        if (bid != null) {

            data.setInventoryValue(
                    Optional.ofNullable(inventoryRepo.sumTotalValueByBranch(bid))
                            .orElse(BigDecimal.ZERO)
            );

            data.setLowStockCount((int) inventoryRepo.countLowStockByBranch(bid));
        }

        /*
        ─────────────────────────────
        RECIPES
        ─────────────────────────────
         */

        long activeRecipes;

        if (admin) {

            activeRecipes =
                    recipeRepo.countByStatus(Recipe.RecipeStatus.ACTIVE);

        } else {

            activeRecipes =
                    recipeRepo.countActiveVisibleToBranch(bid);
        }

        data.setActiveRecipes((int) activeRecipes);

        /*
        ─────────────────────────────
        SUPPLIERS
        ─────────────────────────────
         */

        int supplierCount =
                bid != null
                        ? supplierRepo.countVisibleToBranch(bid)
                        : (int) supplierRepo.count();

        data.setActiveSuppliers(supplierCount);

        /*
        ─────────────────────────────
        PURCHASE ORDERS
        ─────────────────────────────
         */

        List<PurchaseOrder> orders =
                bid != null
                        ? poRepo.findByBranchIdWithItems(bid)
                        : List.of();

        long monthlyOrders = orders.stream()
                .filter(p ->
                        p.getCreatedAt() != null &&
                                !p.getCreatedAt().toLocalDate().isBefore(monthStart)
                )
                .count();

        data.setMonthlyOrders((int) monthlyOrders);

        /*
        ─────────────────────────────
        RECENT ORDERS
        ─────────────────────────────
         */

        data.setRecentOrders(

                orders.stream()
                        .limit(5)
                        .map(po -> {

                            DashboardController.RecentOrder ro =
                                    new DashboardController.RecentOrder();

                            ro.setPoNumber(po.getPoNumber());

                            ro.setSupplierName(
                                    po.getSupplier() != null
                                            ? po.getSupplier().getName()
                                            : "Unknown"
                            );

                            ro.setItemCount(
                                    po.getItems() != null
                                            ? po.getItems().size()
                                            : 0
                            );

                            ro.setTotalAmount(po.getTotalAmount());

                            ro.setStatus(po.getStatus().name());

                            return ro;

                        }).toList()
        );

        /*
        ─────────────────────────────
        WASTAGE
        ─────────────────────────────
         */

        if (bid != null) {

            data.setPendingWastage(
                    (int) wastageRepo.countPendingByBranch(bid)
            );

            data.setWastageTotal(
                    Optional.ofNullable(wastageRepo.sumTotalLossByBranch(bid))
                            .orElse(BigDecimal.ZERO)
            );
        }

        /*
        ─────────────────────────────
        LOW STOCK ITEMS
        ─────────────────────────────
         */

        if (bid != null) {

            data.setLowStockItems(

                    inventoryRepo.findLowStockByBranch(bid)
                            .stream()
                            .limit(5)
                            .map(item -> {

                                DashboardController.LowStockItem ls =
                                        new DashboardController.LowStockItem();

                                ls.setName(item.getIngredient().getName());
                                ls.setCurrent(item.getCurrentQuantity());
                                ls.setMin(item.getMinStockLevel());
                                ls.setUnit(item.getIngredient().getUnit());

                                return ls;

                            }).toList()
            );
        }

        /*
        ─────────────────────────────
        SALES SUMMARY
        ─────────────────────────────
         */

        if (bid != null) {

            SalesService.SalesSummary summary =
                    salesService.getSummary(bid, monthStart, today);

            data.setTopRecipes(summary.getTopRecipes());
            data.setTotalOrders(summary.getTotalOrders());
        }

        /*
        ─────────────────────────────
        ADMIN BRANCH COMPARISON
        ─────────────────────────────
         */

        if (admin) {

            data.setBranchRevenue(

                    salesRepo.findRevenueByBranch(monthStart, today)
                            .stream()
                            .map(row -> {

                                DashboardController.BranchRevenue br =
                                        new DashboardController.BranchRevenue();

                                Long branchIdRow = (Long) row[0];

                                br.setBranchId(branchIdRow);
                                br.setBranchName((String) row[1]);

                                br.setRevenue(
                                        row[2] != null
                                                ? (BigDecimal) row[2]
                                                : BigDecimal.ZERO
                                );

                                br.setWastageTotal(
                                        Optional.ofNullable(
                                                        wastageRepo.sumTotalLossByBranch(branchIdRow))
                                                .orElse(BigDecimal.ZERO)
                                );

                                return br;

                            }).toList()
            );

            data.setTotalBranches((int) branchRepo.count());
        }

        return data;
    }
}