package com.fooderp.repository;

import com.fooderp.entity.WastageRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.util.List;

@Repository
public interface WastageRecordRepository extends JpaRepository<WastageRecord, Long> {

    List<WastageRecord> findByBranchIdOrderByCreatedAtDesc(Long branchId);

    List<WastageRecord> findByBranchIdAndStatusOrderByCreatedAtDesc(
            Long branchId, WastageRecord.WastageStatus status);

    List<WastageRecord> findByStatusOrderByCreatedAtDesc(WastageRecord.WastageStatus status);

    @Query("SELECT COUNT(w) FROM WastageRecord w WHERE w.branch.id = :branchId " +
            "AND w.status = 'PENDING'")
    long countPendingByBranch(@Param("branchId") Long branchId);

    @Query("SELECT COALESCE(SUM(w.costLoss), 0) FROM WastageRecord w " +
            "WHERE w.branch.id = :branchId AND w.status = 'APPROVED'")
    BigDecimal sumTotalLossByBranch(@Param("branchId") Long branchId);
}