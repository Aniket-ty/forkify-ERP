package com.fooderp.controller;

import com.fooderp.repository.*;
import com.fooderp.security.UserDetailsImpl;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.DayOfWeek;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/analytics")
@CrossOrigin(origins = "*")
public class AnalyticsController {

    @Autowired private SalesEntryRepository    salesRepo;
    @Autowired private WastageRecordRepository wastageRepo;
    @Autowired private ProductionLogRepository productionRepo;
    @Autowired private InventoryItemRepository inventoryRepo;
    @Autowired private BranchRepository        branchRepo;

    private Long resolveBranch(Authentication auth, Long branchId) {
        UserDetailsImpl u = (UserDetailsImpl) auth.getPrincipal();
        boolean isAdmin = u.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        return (isAdmin && branchId != null) ? branchId : u.getBranchId();
    }

    // GET /api/analytics/overview?branchId=&days=30
    @GetMapping("/overview")
    public ResponseEntity<?> getOverview(
            @RequestParam(required = false) Long branchId,
            @RequestParam(defaultValue = "30") int days,
            Authentication auth) {

        Long bid = resolveBranch(auth, branchId);
        LocalDate to   = LocalDate.now();
        LocalDate from = to.minusDays(days);
        LocalDate prevFrom = from.minusDays(days);

        AnalyticsOverview overview = new AnalyticsOverview();

        if (bid != null) {
            var entries = salesRepo.findByBranchAndDateRange(bid, from, to);
            var prevEntries = salesRepo.findByBranchAndDateRange(bid, prevFrom, from.minusDays(1));

            BigDecimal revenue  = entries.stream().map(e -> e.getTotalRevenue() != null ? e.getTotalRevenue() : BigDecimal.ZERO).reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal cogs     = entries.stream().map(e -> e.getCostOfGoods()  != null ? e.getCostOfGoods()  : BigDecimal.ZERO).reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal prevRev  = prevEntries.stream().map(e -> e.getTotalRevenue() != null ? e.getTotalRevenue() : BigDecimal.ZERO).reduce(BigDecimal.ZERO, BigDecimal::add);

            overview.setRevenue(revenue);
            overview.setCogs(cogs);
            overview.setGrossProfit(revenue.subtract(cogs).setScale(2, RoundingMode.HALF_UP));
            overview.setFoodCostPct(revenue.compareTo(BigDecimal.ZERO) > 0
                    ? cogs.divide(revenue, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)).setScale(1, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO);
            overview.setRevenueGrowth(prevRev.compareTo(BigDecimal.ZERO) > 0
                    ? revenue.subtract(prevRev).divide(prevRev, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)).setScale(1, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO);
            overview.setTotalCovers(entries.stream().mapToInt(e -> e.getQuantitySold() != null ? e.getQuantitySold() : 0).sum());
            overview.setAvgOrderValue(overview.getTotalCovers() > 0
                    ? revenue.divide(BigDecimal.valueOf(overview.getTotalCovers()), 2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO);

            // Day of week breakdown
            Map<String, DayStats> byDay = new LinkedHashMap<>();
            for (DayOfWeek d : DayOfWeek.values()) byDay.put(d.name(), new DayStats(d.name(), BigDecimal.ZERO, 0));
            entries.forEach(e -> {
                String day = e.getSaleDate().getDayOfWeek().name();
                DayStats ds = byDay.get(day);
                if (ds != null) {
                    ds.setRevenue(ds.getRevenue().add(e.getTotalRevenue() != null ? e.getTotalRevenue() : BigDecimal.ZERO));
                    ds.setCovers(ds.getCovers() + (e.getQuantitySold() != null ? e.getQuantitySold() : 0));
                }
            });
            overview.setByDayOfWeek(new ArrayList<>(byDay.values()));

            // Daily trend (last N days)
            Map<LocalDate, BigDecimal> trend = new TreeMap<>();
            entries.forEach(e -> trend.merge(e.getSaleDate(),
                    e.getTotalRevenue() != null ? e.getTotalRevenue() : BigDecimal.ZERO, BigDecimal::add));
            overview.setDailyTrend(trend.entrySet().stream()
                    .map(en -> new DayRevenue(en.getKey().toString(), en.getValue()))
                    .collect(Collectors.toList()));

            // Top 10 recipes by revenue
            Map<String, RecipePerf> recipeMap = new LinkedHashMap<>();
            entries.forEach(e -> {
                String key = e.getRecipe().getName();
                RecipePerf rp = recipeMap.computeIfAbsent(key, k -> new RecipePerf(k, e.getRecipe().getCategory(), BigDecimal.ZERO, BigDecimal.ZERO, 0));
                rp.setRevenue(rp.getRevenue().add(e.getTotalRevenue() != null ? e.getTotalRevenue() : BigDecimal.ZERO));
                rp.setCogs(rp.getCogs().add(e.getCostOfGoods() != null ? e.getCostOfGoods() : BigDecimal.ZERO));
                rp.setCovers(rp.getCovers() + (e.getQuantitySold() != null ? e.getQuantitySold() : 0));
            });
            overview.setTopRecipes(recipeMap.values().stream()
                    .sorted(Comparator.comparing(RecipePerf::getRevenue).reversed())
                    .limit(10)
                    .map(rp -> {
                        if (rp.getRevenue().compareTo(BigDecimal.ZERO) > 0) {
                            rp.setFoodCostPct(rp.getCogs().divide(rp.getRevenue(), 4, RoundingMode.HALF_UP)
                                    .multiply(BigDecimal.valueOf(100)).setScale(1, RoundingMode.HALF_UP));
                            rp.setMargin(rp.getRevenue().subtract(rp.getCogs()).setScale(2, RoundingMode.HALF_UP));
                        }
                        return rp;
                    })
                    .collect(Collectors.toList()));

            // Wastage trend
            BigDecimal wastageLoss = wastageRepo.sumTotalLossByBranch(bid);
            overview.setWastageLoss(wastageLoss != null ? wastageLoss : BigDecimal.ZERO);
            if (revenue.compareTo(BigDecimal.ZERO) > 0 && wastageLoss != null) {
                overview.setWastagePct(wastageLoss.divide(revenue, 4, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100)).setScale(1, RoundingMode.HALF_UP));
            }
        }

        return ResponseEntity.ok(overview);
    }

    // GET /api/analytics/food-cost?branchId=&days=30
    @GetMapping("/food-cost")
    public ResponseEntity<?> getFoodCost(
            @RequestParam(required = false) Long branchId,
            @RequestParam(defaultValue = "30") int days,
            Authentication auth) {

        Long bid = resolveBranch(auth, branchId);
        LocalDate to   = LocalDate.now();
        LocalDate from = to.minusDays(days);

        List<FoodCostItem> items = new ArrayList<>();
        if (bid != null) {
            var entries = salesRepo.findByBranchAndDateRange(bid, from, to);
            Map<String, FoodCostItem> map = new LinkedHashMap<>();
            entries.forEach(e -> {
                String key = e.getRecipe().getName();
                FoodCostItem item = map.computeIfAbsent(key, k -> {
                    FoodCostItem fc = new FoodCostItem();
                    fc.setRecipeName(k);
                    fc.setCategory(e.getRecipe().getCategory());
                    return fc;
                });
                item.setRevenue(item.getRevenue().add(e.getTotalRevenue() != null ? e.getTotalRevenue() : BigDecimal.ZERO));
                item.setCogs(item.getCogs().add(e.getCostOfGoods() != null ? e.getCostOfGoods() : BigDecimal.ZERO));
                item.setCovers(item.getCovers() + (e.getQuantitySold() != null ? e.getQuantitySold() : 0));
            });
            map.values().forEach(item -> {
                if (item.getRevenue().compareTo(BigDecimal.ZERO) > 0) {
                    item.setFoodCostPct(item.getCogs().divide(item.getRevenue(), 4, RoundingMode.HALF_UP)
                            .multiply(BigDecimal.valueOf(100)).setScale(1, RoundingMode.HALF_UP));
                    item.setGrossMargin(item.getRevenue().subtract(item.getCogs()).setScale(2, RoundingMode.HALF_UP));
                    item.setMarginPct(item.getGrossMargin().divide(item.getRevenue(), 4, RoundingMode.HALF_UP)
                            .multiply(BigDecimal.valueOf(100)).setScale(1, RoundingMode.HALF_UP));
                    // Flag: food cost > 35% is high
                    item.setAlert(item.getFoodCostPct().compareTo(BigDecimal.valueOf(35)) > 0);
                }
            });
            items = new ArrayList<>(map.values());
            items.sort(Comparator.comparing(FoodCostItem::getFoodCostPct).reversed());
        }
        return ResponseEntity.ok(items);
    }

    // DTOs
    @Data public static class AnalyticsOverview {
        private BigDecimal revenue = BigDecimal.ZERO;
        private BigDecimal cogs = BigDecimal.ZERO;
        private BigDecimal grossProfit = BigDecimal.ZERO;
        private BigDecimal foodCostPct = BigDecimal.ZERO;
        private BigDecimal revenueGrowth = BigDecimal.ZERO;
        private BigDecimal wastageLoss = BigDecimal.ZERO;
        private BigDecimal wastagePct = BigDecimal.ZERO;
        private BigDecimal avgOrderValue = BigDecimal.ZERO;
        private int totalCovers;
        private List<DayStats> byDayOfWeek = new ArrayList<>();
        private List<DayRevenue> dailyTrend = new ArrayList<>();
        private List<RecipePerf> topRecipes = new ArrayList<>();
    }
    @Data public static class DayStats {
        private String day; private BigDecimal revenue; private int covers;
        public DayStats(String d, BigDecimal r, int c) { day=d; revenue=r; covers=c; }
    }
    @Data public static class DayRevenue {
        private String date; private BigDecimal revenue;
        public DayRevenue(String d, BigDecimal r) { date=d; revenue=r; }
    }
    @Data public static class RecipePerf {
        private String recipeName, category;
        private BigDecimal revenue = BigDecimal.ZERO;
        private BigDecimal cogs = BigDecimal.ZERO;
        private BigDecimal margin = BigDecimal.ZERO;
        private BigDecimal foodCostPct = BigDecimal.ZERO;
        private int covers;
        public RecipePerf(String n, String c, BigDecimal r, BigDecimal cg, int co) { recipeName=n; category=c; revenue=r; cogs=cg; covers=co; }
    }
    @Data public static class FoodCostItem {
        private String recipeName, category;
        private BigDecimal revenue = BigDecimal.ZERO;
        private BigDecimal cogs = BigDecimal.ZERO;
        private BigDecimal grossMargin = BigDecimal.ZERO;
        private BigDecimal foodCostPct = BigDecimal.ZERO;
        private BigDecimal marginPct = BigDecimal.ZERO;
        private int covers;
        private boolean alert;
    }
}