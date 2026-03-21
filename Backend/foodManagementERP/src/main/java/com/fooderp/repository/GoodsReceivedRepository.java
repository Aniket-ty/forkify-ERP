package com.fooderp.repository;

import com.fooderp.entity.GoodsReceived;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface GoodsReceivedRepository extends JpaRepository<GoodsReceived, Long> {
    List<GoodsReceived> findByBranchIdOrderByCreatedAtDesc(Long branchId);
    List<GoodsReceived> findByPurchaseOrderIdOrderByCreatedAtDesc(Long poId);
    Optional<GoodsReceived> findByPurchaseOrderIdAndStatus(
            Long poId, GoodsReceived.GRNStatus status);
}
