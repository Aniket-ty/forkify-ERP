package com.fooderp.repository;

import com.fooderp.entity.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MenuItemRepository extends JpaRepository<MenuItem, Long> {
    List<MenuItem> findByMenuId(Long menuId);
    List<MenuItem> findByMenuIdOrderBySortOrderAsc(Long menuId);
    void deleteByMenuId(Long menuId);
}