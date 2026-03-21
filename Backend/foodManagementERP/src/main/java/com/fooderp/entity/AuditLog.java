package com.fooderp.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Who did it
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    private String username; // denormalized — keep even if user deleted

    // Which branch
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id")
    private Branch branch;

    // What happened
    @Column(nullable = false)
    private String action;       // CREATE, UPDATE, DELETE, LOGIN, LOGOUT, APPROVE, REJECT

    @Column(nullable = false)
    private String entityType;   // Recipe, Inventory, ProductionLog, PurchaseOrder, etc.

    private Long   entityId;
    private String entityName;   // human-readable identifier

    @Column(length = 2000)
    private String details;      // JSON or text description of changes

    // HTTP context
    private String ipAddress;
    private String httpMethod;
    private String endpoint;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
