package com.fooderp.controller;

import com.fooderp.security.UserDetailsImpl;
import com.fooderp.service.DashboardService;
import com.fooderp.service.SalesService;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "*")
public class DashboardController {

    @Autowired
    private DashboardService dashboardService;

    @GetMapping
    public ResponseEntity<?> getDashboard(
            @RequestParam(required = false) Long branchId,
            Authentication auth) {

        DashboardData data = dashboardService.getDashboard(branchId, auth);
        return ResponseEntity.ok(data);
    }

    /*
    ─────────────────────────────────────────────
    DTO CLASSES
    ─────────────────────────────────────────────
     */

    @Data
    public static class DashboardData {

        private BigDecimal totalRevenue = BigDecimal.ZERO;
        private BigDecimal lastMonthRevenue = BigDecimal.ZERO;
        private BigDecimal inventoryValue = BigDecimal.ZERO;
        private BigDecimal wastageTotal = BigDecimal.ZERO;

        private int lowStockCount;
        private int activeRecipes;
        private int activeSuppliers;
        private int monthlyOrders;
        private int totalOrders;
        private int pendingWastage;
        private int totalBranches;

        private List<LowStockItem> lowStockItems = new ArrayList<>();
        private List<RecentOrder> recentOrders = new ArrayList<>();
        private List<SalesService.TopRecipe> topRecipes = new ArrayList<>();
        private List<BranchRevenue> branchRevenue = new ArrayList<>();
    }

    @Data
    public static class LowStockItem {

        private String name;
        private String unit;
        private double current;
        private double min;
    }

    @Data
    public static class RecentOrder {

        private String poNumber;
        private String supplierName;
        private String status;

        private int itemCount;
        private BigDecimal totalAmount;
    }

    @Data
    public static class BranchRevenue {

        private Long branchId;
        private String branchName;
        private BigDecimal revenue = BigDecimal.ZERO;
        private BigDecimal wastageTotal = BigDecimal.ZERO;
    }
}