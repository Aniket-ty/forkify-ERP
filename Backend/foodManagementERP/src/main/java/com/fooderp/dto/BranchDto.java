package com.fooderp.dto;

import com.fooderp.entity.Branch;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

public class BranchDto {

    // ── Request ──────────────────────────────────────────────────────────────
    @Data
    public static class Request {
        @NotBlank(message = "Branch name is required")
        private String name;

        @NotBlank(message = "City is required")
        private String city;

        private String address;
        private String phone;
        private Branch.BranchType type = Branch.BranchType.BRANCH;
    }

    // ── Response ─────────────────────────────────────────────────────────────
    @Data
    public static class Response {
        private Long id;
        private String name;
        private String city;
        private String address;
        private String phone;
        private String type;
        private boolean active;
        private long userCount;

        public static Response from(Branch branch, long userCount) {
            Response r = new Response();
            r.id        = branch.getId();
            r.name      = branch.getName();
            r.city      = branch.getCity();
            r.address   = branch.getAddress();
            r.phone     = branch.getPhone();
            r.type      = branch.getType().name();
            r.active    = branch.isActive();
            r.userCount = userCount;
            return r;
        }
    }
}