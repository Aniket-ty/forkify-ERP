package com.fooderp.dto;

import lombok.Data;

@Data
public class JwtResponse {
    private String token;
    private String type = "Bearer";
    private Long id;
    private String username;
    private String email;
    private String fullName;
    private String role;
    private Long branchId;
    private String branchName;

    public JwtResponse(String token, Long id, String username, String email,
                       String fullName, String role, Long branchId, String branchName) {
        this.token      = token;
        this.type       = "Bearer";
        this.id         = id;
        this.username   = username;
        this.email      = email;
        this.fullName   = fullName;
        this.role       = role;
        this.branchId   = branchId;
        this.branchName = branchName;
    }
}