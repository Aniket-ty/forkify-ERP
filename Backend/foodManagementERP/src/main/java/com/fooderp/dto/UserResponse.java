package com.fooderp.dto;

import com.fooderp.entity.User;
import lombok.Data;

@Data
public class UserResponse {
    private Long id;
    private String username;
    private String email;
    private String fullName;
    private String role;
    private Long branchId;
    private String branchName;
    private boolean enabled;

    public static UserResponse from(User user) {
        UserResponse r = new UserResponse();
        r.id         = user.getId();
        r.username   = user.getUsername();
        r.email      = user.getEmail();
        r.fullName   = user.getFullName();
        r.role       = user.getRole().name();
        r.branchId   = user.getBranch() != null ? user.getBranch().getId()   : null;
        r.branchName = user.getBranch() != null ? user.getBranch().getName() : null;
        r.enabled    = user.isEnabled();
        return r;
    }
}