package com.fooderp.controller;

import com.fooderp.entity.Shift;
import com.fooderp.repository.BranchRepository;
import com.fooderp.repository.ShiftRepository;
import com.fooderp.repository.UserRepository;
import com.fooderp.security.UserDetailsImpl;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/shifts")
@CrossOrigin(origins = "*")
public class ShiftController {

    @Autowired
    private ShiftRepository shiftRepo;

    @Autowired
    private UserRepository userRepo;

    @Autowired
    private BranchRepository branchRepo;


    private Long resolveBranch(Authentication auth, Long branchId) {
        UserDetailsImpl u = (UserDetailsImpl) auth.getPrincipal();
        boolean isAdmin = u.getAuthorities()
                .stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        return (isAdmin && branchId != null) ? branchId : u.getBranchId();
    }

    // ---------------- GET ALL SHIFTS ----------------

    @GetMapping
    public ResponseEntity<?> getShifts(
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            Authentication auth) {

        Long bid = resolveBranch(auth, branchId);

        if (bid == null)
            return ResponseEntity.badRequest().body("Branch not assigned");

        LocalDate dateFrom = from != null ? LocalDate.parse(from)
                : LocalDate.now().withDayOfMonth(1);

        LocalDate dateTo = to != null ? LocalDate.parse(to)
                : dateFrom.plusMonths(1).minusDays(1);

        List<Shift> shifts = shiftRepo.findByBranchAndDateRange(bid, dateFrom, dateTo);

        return ResponseEntity.ok(
                shifts.stream().map(this::toDto).collect(Collectors.toList())
        );
    }


    // ---------------- MY SHIFTS ----------------

    @GetMapping("/my")
    public ResponseEntity<?> getMyShifts(
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            Authentication auth) {

        UserDetailsImpl u = (UserDetailsImpl) auth.getPrincipal();

        LocalDate dateFrom = from != null ? LocalDate.parse(from)
                : LocalDate.now().withDayOfMonth(1);

        LocalDate dateTo = to != null ? LocalDate.parse(to)
                : dateFrom.plusMonths(1).minusDays(1);

        List<Shift> shifts =
                shiftRepo.findByUserAndDateRange(u.getId(), dateFrom, dateTo);

        return ResponseEntity.ok(
                shifts.stream().map(this::toDto).collect(Collectors.toList())
        );
    }


    // ---------------- CREATE SHIFT ----------------

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<?> create(@RequestBody ShiftRequest req,
                                    Authentication auth) {

        try {

            Shift s = new Shift();

            userRepo.findById(req.getUserId()).ifPresent(s::setUser);

            Long bid = resolveBranch(auth, req.getBranchId());

            branchRepo.findById(bid).ifPresent(s::setBranch);

            s.setShiftDate(LocalDate.parse(req.getShiftDate()));
            s.setStartTime(LocalTime.parse(req.getStartTime()));
            s.setEndTime(LocalTime.parse(req.getEndTime()));

            if (req.getType() != null)
                s.setType(Shift.ShiftType.valueOf(req.getType().toUpperCase()));

            s.setNotes(req.getNotes());

            UserDetailsImpl caller = (UserDetailsImpl) auth.getPrincipal();

            userRepo.findById(caller.getId()).ifPresent(s::setCreatedBy);

            Shift saved = shiftRepo.save(s);

            Shift loaded = shiftRepo.findByIdWithUserAndBranch(saved.getId());

            return ResponseEntity.ok(toDto(loaded));

        } catch (Exception e) {

            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }


    // ---------------- UPDATE SHIFT ----------------

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<?> update(@PathVariable Long id,
                                    @RequestBody ShiftRequest req) {

        Shift s = shiftRepo.findByIdWithUserAndBranch(id);

        if (s == null)
            return ResponseEntity.notFound().build();

        if (req.getStartTime() != null)
            s.setStartTime(LocalTime.parse(req.getStartTime()));

        if (req.getEndTime() != null)
            s.setEndTime(LocalTime.parse(req.getEndTime()));

        if (req.getType() != null)
            s.setType(Shift.ShiftType.valueOf(req.getType().toUpperCase()));

        if (req.getNotes() != null)
            s.setNotes(req.getNotes());

        if (req.getStatus() != null)
            s.setStatus(Shift.ShiftStatus.valueOf(req.getStatus().toUpperCase()));

        shiftRepo.save(s);

        return ResponseEntity.ok(toDto(s));
    }


    // ---------------- CLOCK IN ----------------

    @PutMapping("/{id}/clock-in")
    public ResponseEntity<?> clockIn(@PathVariable Long id) {

        Shift s = shiftRepo.findByIdWithUserAndBranch(id);

        if (s == null)
            return ResponseEntity.notFound().build();

        s.setClockIn(LocalDateTime.now());
        s.setStatus(Shift.ShiftStatus.IN_PROGRESS);

        shiftRepo.save(s);

        return ResponseEntity.ok(toDto(s));
    }


    // ---------------- CLOCK OUT ----------------

    @PutMapping("/{id}/clock-out")
    public ResponseEntity<?> clockOut(@PathVariable Long id) {

        Shift s = shiftRepo.findByIdWithUserAndBranch(id);

        if (s == null)
            return ResponseEntity.notFound().build();

        s.setClockOut(LocalDateTime.now());
        s.setStatus(Shift.ShiftStatus.COMPLETED);

        shiftRepo.save(s);

        return ResponseEntity.ok(toDto(s));
    }


    // ---------------- DELETE ----------------

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<?> delete(@PathVariable Long id) {

        shiftRepo.deleteById(id);

        return ResponseEntity.ok(Map.of("message", "Shift deleted"));
    }


    // ---------------- DTO MAPPER ----------------

    private ShiftDto toDto(Shift s) {

        ShiftDto d = new ShiftDto();

        d.setId(s.getId());

        d.setUserId(s.getUser() != null ? s.getUser().getId() : null);
        d.setUserName(s.getUser() != null ? s.getUser().getFullName() : null);
        d.setUserRole(s.getUser() != null ? s.getUser().getRole().name() : null);

        d.setBranchId(s.getBranch() != null ? s.getBranch().getId() : null);
        d.setBranchName(s.getBranch() != null ? s.getBranch().getName() : null);

        d.setShiftDate(s.getShiftDate() != null ? s.getShiftDate().toString() : null);
        d.setStartTime(s.getStartTime() != null ? s.getStartTime().toString() : null);
        d.setEndTime(s.getEndTime() != null ? s.getEndTime().toString() : null);

        d.setType(s.getType().name());
        d.setStatus(s.getStatus().name());
        d.setNotes(s.getNotes());

        d.setClockIn(s.getClockIn() != null ? s.getClockIn().toString() : null);
        d.setClockOut(s.getClockOut() != null ? s.getClockOut().toString() : null);

        if (s.getClockIn() != null && s.getClockOut() != null) {
            long mins = java.time.temporal.ChronoUnit.MINUTES
                    .between(s.getClockIn(), s.getClockOut());

            d.setHoursWorked(Math.round(mins / 60.0 * 10.0) / 10.0);
        }

        return d;
    }


    // ---------------- REQUEST DTO ----------------

    @Data
    public static class ShiftRequest {
        private Long userId;
        private Long branchId;
        private String shiftDate;
        private String startTime;
        private String endTime;
        private String type;
        private String status;
        private String notes;
    }


    // ---------------- RESPONSE DTO ----------------

    @Data
    public static class ShiftDto {

        private Long id;
        private Long userId;
        private Long branchId;

        private String userName;
        private String userRole;
        private String branchName;

        private String shiftDate;
        private String startTime;
        private String endTime;

        private String type;
        private String status;
        private String notes;

        private String clockIn;
        private String clockOut;

        private Double hoursWorked;
    }
}