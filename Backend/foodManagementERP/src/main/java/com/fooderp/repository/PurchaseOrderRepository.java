package com.fooderp.repository;

import com.fooderp.entity.PurchaseOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, Long> {
    List<PurchaseOrder> findByBranchIdOrderByCreatedAtDesc(Long branchId);
    List<PurchaseOrder> findByBranchIdAndStatusOrderByCreatedAtDesc(
            Long branchId, PurchaseOrder.POStatus status);
    List<PurchaseOrder> findBySupplierIdOrderByCreatedAtDesc(Long supplierId);
    List<PurchaseOrder> findAllByOrderByCreatedAtDesc();
    @Query("""
SELECT DISTINCT po
FROM PurchaseOrder po
LEFT JOIN FETCH po.items
WHERE po.branch.id = :branchId
ORDER BY po.createdAt DESC
""")
    List<PurchaseOrder> findByBranchIdWithItems(Long branchId);
}
