package com.fooderp.controller;

import com.fooderp.entity.Customer;
import com.fooderp.repository.BranchRepository;
import com.fooderp.repository.CustomerRepository;
import com.fooderp.security.UserDetailsImpl;
import jakarta.transaction.Transactional;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/customers")
@CrossOrigin(origins = "*")
public class CustomerController {

    @Autowired CustomerRepository customerRepo;
    @Autowired BranchRepository   branchRepo;

    private Long resolveBranch(Authentication auth, Long branchId) {
        UserDetailsImpl u = (UserDetailsImpl) auth.getPrincipal();
        boolean isAdmin = u.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        return (isAdmin && branchId != null) ? branchId : u.getBranchId();
    }

    // GET /api/customers?branchId=&q=
    @GetMapping
    @Transactional
    public ResponseEntity<?> getAll(
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) String q,
            Authentication auth) {
        if (q != null && !q.isBlank()) return ResponseEntity.ok(customerRepo.search(q).stream().map(this::toDto).collect(Collectors.toList()));
        Long bid = resolveBranch(auth, branchId);
        List<Customer> list = bid != null ? customerRepo.findByBranchIdOrderByTotalSpendDesc(bid) : customerRepo.findByActiveTrue();
        return ResponseEntity.ok(list.stream().map(this::toDto).collect(Collectors.toList()));
    }

    // GET /api/customers/{id}
    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        return customerRepo.findById(id).map(c -> ResponseEntity.ok(toDto(c))).orElse(ResponseEntity.notFound().build());
    }

    // POST /api/customers
    @PostMapping
    public ResponseEntity<?> create(@RequestBody CustomerRequest req, Authentication auth) {
        if (req.getPhone() != null && customerRepo.existsByPhone(req.getPhone()))
            return ResponseEntity.badRequest().body("Phone number already registered");
        Long bid = resolveBranch(auth, null);
        Customer c = new Customer();
        mapRequest(req, c);
        if (bid != null) branchRepo.findById(bid).ifPresent(c::setBranch);
        return ResponseEntity.ok(toDto(customerRepo.save(c)));
    }

    // PUT /api/customers/{id}
    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody CustomerRequest req) {
        return customerRepo.findById(id).map(c -> {
            mapRequest(req, c);
            return ResponseEntity.ok(toDto(customerRepo.save(c)));
        }).orElse(ResponseEntity.notFound().build());
    }

    // PUT /api/customers/{id}/add-points
    @PutMapping("/{id}/add-points")
    @Transactional
    public ResponseEntity<?> addPoints(@PathVariable Long id, @RequestBody Map<String, Integer> body) {
        return customerRepo.findById(id).map(c -> {
            int pts = body.getOrDefault("points", 0);
            c.setLoyaltyPoints(c.getLoyaltyPoints() + pts);
            return ResponseEntity.ok(toDto(customerRepo.save(c)));
        }).orElse(ResponseEntity.notFound().build());
    }

    // PUT /api/customers/{id}/redeem-points
    @PutMapping("/{id}/redeem-points")
    @Transactional
    public ResponseEntity<?> redeemPoints(@PathVariable Long id, @RequestBody Map<String, Integer> body) {
        return customerRepo.findById(id).map(c -> {
            int pts = body.getOrDefault("points", 0);
            if (c.getLoyaltyPoints() < pts) return ResponseEntity.badRequest().body((Object)"Insufficient points");
            c.setLoyaltyPoints(c.getLoyaltyPoints() - pts);
            return ResponseEntity.ok((Object) toDto(customerRepo.save(c)));
        }).orElse(ResponseEntity.notFound().build());
    }

    // PUT /api/customers/{id}/record-visit
    @PutMapping("/{id}/record-visit")
    @Transactional
    public ResponseEntity<?> recordVisit(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return customerRepo.findById(id).map(c -> {
            c.setVisitCount(c.getVisitCount() + 1);
            c.setLastVisit(LocalDate.now());
            BigDecimal spend = body.get("spend") != null ? new BigDecimal(body.get("spend").toString()) : BigDecimal.ZERO;
            c.setTotalSpend(c.getTotalSpend().add(spend));
            // Award 1 point per ₹10 spent
            int pts = spend.divideToIntegralValue(BigDecimal.TEN).intValue();
            c.setLoyaltyPoints(c.getLoyaltyPoints() + pts);
            return ResponseEntity.ok(toDto(customerRepo.save(c)));
        }).orElse(ResponseEntity.notFound().build());
    }

    // GET /api/customers/birthdays?month=
    @GetMapping("/birthdays")
    public ResponseEntity<?> getBirthdays(@RequestParam(defaultValue = "0") int month) {
        int m = month > 0 ? month : LocalDate.now().getMonthValue();
        return ResponseEntity.ok(customerRepo.findBirthdaysInMonth(m).stream().map(this::toDto).collect(Collectors.toList()));
    }

    // GET /api/customers/stats?branchId=
    @GetMapping("/stats")
    public ResponseEntity<?> getStats(@RequestParam(required = false) Long branchId, Authentication auth) {
        Long bid = resolveBranch(auth, branchId);
        long total = bid != null ? customerRepo.countByBranchId(bid) : customerRepo.count();
        int birthdays = customerRepo.findBirthdaysInMonth(LocalDate.now().getMonthValue()).size();
        return ResponseEntity.ok(Map.of("totalCustomers", total, "birthdaysThisMonth", birthdays));
    }

    private void mapRequest(CustomerRequest req, Customer c) {
        if (req.getName()    != null) c.setName(req.getName());
        if (req.getPhone()   != null) c.setPhone(req.getPhone());
        if (req.getEmail()   != null) c.setEmail(req.getEmail());
        if (req.getNotes()   != null) c.setNotes(req.getNotes());
        if (req.getDateOfBirth() != null)    c.setDateOfBirth(LocalDate.parse(req.getDateOfBirth()));
        if (req.getAnniversaryDate() != null) c.setAnniversaryDate(LocalDate.parse(req.getAnniversaryDate()));
    }

    private CustomerDto toDto(Customer c) {
        CustomerDto d = new CustomerDto();
        d.setId(c.getId()); d.setName(c.getName()); d.setPhone(c.getPhone()); d.setEmail(c.getEmail());
        d.setLoyaltyPoints(c.getLoyaltyPoints()); d.setTotalSpend(c.getTotalSpend());
        d.setVisitCount(c.getVisitCount()); d.setLastVisit(c.getLastVisit() != null ? c.getLastVisit().toString() : null);
        d.setDateOfBirth(c.getDateOfBirth() != null ? c.getDateOfBirth().toString() : null);
        d.setAnniversaryDate(c.getAnniversaryDate() != null ? c.getAnniversaryDate().toString() : null);
        d.setBranchName(c.getBranch() != null ? c.getBranch().getName() : null);
        d.setNotes(c.getNotes()); d.setActive(c.isActive());
        // Tier based on points
        int pts = c.getLoyaltyPoints();
        d.setTier(pts >= 1000 ? "GOLD" : pts >= 500 ? "SILVER" : "BRONZE");
        return d;
    }

    @Data public static class CustomerRequest {
        private String name, phone, email, notes, dateOfBirth, anniversaryDate;
    }
    @Data public static class CustomerDto {
        private Long id; private String name, phone, email, notes, dateOfBirth, anniversaryDate, lastVisit, branchName, tier;
        private Integer loyaltyPoints, visitCount; private BigDecimal totalSpend; private boolean active;
    }
}