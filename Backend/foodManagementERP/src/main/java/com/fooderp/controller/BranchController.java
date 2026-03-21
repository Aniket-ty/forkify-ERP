package com.fooderp.controller;

import com.fooderp.dto.BranchDto;
import com.fooderp.entity.Branch;
import com.fooderp.repository.BranchRepository;
import com.fooderp.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/branches")
@CrossOrigin(origins = "*")
public class BranchController {

    @Autowired BranchRepository branchRepository;
    @Autowired UserRepository   userRepository;

    // ── GET /api/branches ────────────────────────────────────────────────────
    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<?> getAllBranches() {
        List<BranchDto.Response> list = branchRepository.findByActiveTrue()
                .stream()
                .map(b -> BranchDto.Response.from(b, userRepository.countByBranchId(b.getId())))
                .collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    // ── GET /api/branches/{id} ───────────────────────────────────────────────
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<?> getBranch(@PathVariable Long id) {
        return branchRepository.findById(id)
                .map(b -> ResponseEntity.ok(
                        BranchDto.Response.from(b, userRepository.countByBranchId(b.getId()))))
                .orElse(ResponseEntity.notFound().build());
    }

    // ── POST /api/branches ───────────────────────────────────────────────────
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createBranch(@Valid @RequestBody BranchDto.Request req) {
        if (branchRepository.existsByName(req.getName())) {
            return ResponseEntity.badRequest().body("Error: Branch name already exists!");
        }

        Branch branch = new Branch();
        branch.setName(req.getName());
        branch.setCity(req.getCity());
        branch.setAddress(req.getAddress());
        branch.setPhone(req.getPhone());
        branch.setType(req.getType() != null ? req.getType() : Branch.BranchType.BRANCH);

        Branch saved = branchRepository.save(branch);
        return ResponseEntity.ok(BranchDto.Response.from(saved, 0));
    }

    // ── PUT /api/branches/{id} ───────────────────────────────────────────────
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateBranch(@PathVariable Long id,
                                          @Valid @RequestBody BranchDto.Request req) {
        return branchRepository.findById(id)
                .map(branch -> {
                    branch.setName(req.getName());
                    branch.setCity(req.getCity());
                    branch.setAddress(req.getAddress());
                    branch.setPhone(req.getPhone());
                    if (req.getType() != null) branch.setType(req.getType());
                    Branch saved = branchRepository.save(branch);
                    return ResponseEntity.ok(
                            BranchDto.Response.from(saved, userRepository.countByBranchId(id)));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // ── DELETE /api/branches/{id} (soft delete — sets active=false) ──────────
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deactivateBranch(@PathVariable Long id) {
        return branchRepository.findById(id)
                .map(branch -> {
                    branch.setActive(false);
                    branchRepository.save(branch);
                    return ResponseEntity.ok("Branch deactivated successfully");
                })
                .orElse(ResponseEntity.notFound().build());
    }
}