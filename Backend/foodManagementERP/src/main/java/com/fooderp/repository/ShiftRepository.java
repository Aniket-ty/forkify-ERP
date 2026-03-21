package com.fooderp.repository;

import com.fooderp.entity.Shift;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface ShiftRepository extends JpaRepository<Shift, Long> {

    List<Shift> findByBranchIdAndShiftDateOrderByStartTimeAsc(Long branchId, LocalDate date);

    List<Shift> findByUserIdOrderByShiftDateDesc(Long userId);

    @Query("""
        SELECT s FROM Shift s
        LEFT JOIN FETCH s.user
        LEFT JOIN FETCH s.branch
        WHERE s.branch.id = :branchId
        AND s.shiftDate BETWEEN :from AND :to
        ORDER BY s.shiftDate ASC, s.startTime ASC
    """)
    List<Shift> findByBranchAndDateRange(
            @Param("branchId") Long branchId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to
    );

    @Query("""
        SELECT s FROM Shift s
        LEFT JOIN FETCH s.user
        LEFT JOIN FETCH s.branch
        WHERE s.user.id = :userId
        AND s.shiftDate BETWEEN :from AND :to
    """)
    List<Shift> findByUserAndDateRange(
            @Param("userId") Long userId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to
    );
    @Query("""
SELECT s FROM Shift s
LEFT JOIN FETCH s.user
LEFT JOIN FETCH s.branch
WHERE s.id = :id
""")
    Shift findByIdWithUserAndBranch(@Param("id") Long id);
}