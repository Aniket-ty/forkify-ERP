package com.fooderp.repository;

import com.fooderp.entity.Branch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface BranchRepository extends JpaRepository<Branch, Long> {
    List<Branch> findByActiveTrue();
    List<Branch> findByType(Branch.BranchType type);
    boolean existsByName(String name);
}