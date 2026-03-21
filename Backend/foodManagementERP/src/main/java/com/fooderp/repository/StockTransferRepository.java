package com.fooderp.repository;

import com.fooderp.entity.StockTransfer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface StockTransferRepository extends JpaRepository<StockTransfer, Long> {
    List<StockTransfer> findByFromBranchIdOrderByCreatedAtDesc(Long branchId);
    List<StockTransfer> findByToBranchIdOrderByCreatedAtDesc(Long branchId);

    @Query("SELECT t FROM StockTransfer t WHERE t.fromBranch.id = :branchId OR t.toBranch.id = :branchId ORDER BY t.createdAt DESC")
    List<StockTransfer> findAllForBranch(@Param("branchId") Long branchId);

    @Query("SELECT t FROM StockTransfer t WHERE (t.fromBranch.id = :branchId OR t.toBranch.id = :branchId) AND t.status = :status ORDER BY t.createdAt DESC")
    List<StockTransfer> findByBranchAndStatus(@Param("branchId") Long branchId, @Param("status") StockTransfer.TransferStatus status);
}