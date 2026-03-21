// ── MaterialIndentRepository.java ────────────────────────────────────────────
package com.fooderp.repository;

import com.fooderp.entity.MaterialIndent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MaterialIndentRepository extends JpaRepository<MaterialIndent, Long> {
    List<MaterialIndent> findByBranchIdOrderByCreatedAtDesc(Long branchId);
    List<MaterialIndent> findByBranchIdAndStatusOrderByCreatedAtDesc(
            Long branchId, MaterialIndent.IndentStatus status);
    List<MaterialIndent> findByStatusOrderByCreatedAtDesc(MaterialIndent.IndentStatus status);
}
