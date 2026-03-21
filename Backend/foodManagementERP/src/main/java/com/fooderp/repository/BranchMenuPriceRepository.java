package com.fooderp.repository;

import com.fooderp.entity.BranchMenuPrice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface BranchMenuPriceRepository extends JpaRepository<BranchMenuPrice, Long> {
    List<BranchMenuPrice> findByBranchId(Long branchId);
    List<BranchMenuPrice> findByMenuItemId(Long menuItemId);
    Optional<BranchMenuPrice> findByMenuItemIdAndBranchId(Long menuItemId, Long branchId);
    void deleteByMenuItemId(Long menuItemId);
}