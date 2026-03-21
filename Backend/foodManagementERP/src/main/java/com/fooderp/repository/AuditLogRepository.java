package com.fooderp.repository;

import com.fooderp.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    List<AuditLog> findTop100ByOrderByCreatedAtDesc();

    List<AuditLog> findByUsernameContainingIgnoreCaseOrderByCreatedAtDesc(String username);

    List<AuditLog> findByEntityTypeOrderByCreatedAtDesc(String entityType);

    List<AuditLog> findByBranchIdOrderByCreatedAtDesc(Long branchId);

    @Query("SELECT a FROM AuditLog a WHERE " +
           "(:username IS NULL OR LOWER(a.username) LIKE LOWER(CONCAT('%', :username, '%'))) AND " +
           "(:action IS NULL OR a.action = :action) AND " +
           "(:entityType IS NULL OR a.entityType = :entityType) AND " +
           "(:from IS NULL OR a.createdAt >= :from) AND " +
           "(:to IS NULL OR a.createdAt <= :to) " +
           "ORDER BY a.createdAt DESC")
    List<AuditLog> search(@Param("username")   String username,
                          @Param("action")      String action,
                          @Param("entityType")  String entityType,
                          @Param("from")        LocalDateTime from,
                          @Param("to")          LocalDateTime to);
}
