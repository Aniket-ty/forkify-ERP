// ── SupplierRepository.java ───────────────────────────────────────────────────
package com.fooderp.repository;

import com.fooderp.entity.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SupplierRepository extends JpaRepository<Supplier, Long> {

    // Suppliers visible to a branch = HQ-approved global + branch's own
    @Query("SELECT s FROM Supplier s WHERE s.status = 'ACTIVE' AND " +
            "(s.branch IS NULL OR s.branch.id = :branchId OR s.hqApproved = true) " +
            "ORDER BY s.name ASC")
    List<Supplier> findVisibleToBranch(@Param("branchId") Long branchId);

    // All suppliers (admin)
    List<Supplier> findAllByOrderByNameAsc();

    // HQ-approved only
    List<Supplier> findByHqApprovedTrueAndStatusOrderByNameAsc(Supplier.SupplierStatus status);

    boolean existsByNameIgnoreCase(String name);

    @Query("""
        SELECT COUNT(s)
        FROM Supplier s
        WHERE s.branch.id = :branchId OR s.branch IS NULL
    """)
    int countVisibleToBranch(Long branchId);
}
