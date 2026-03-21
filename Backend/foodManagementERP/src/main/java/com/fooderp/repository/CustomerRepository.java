package com.fooderp.repository;

import com.fooderp.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {

    List<Customer> findByBranchIdOrderByTotalSpendDesc(Long branchId);
    List<Customer> findByActiveTrue();
    Optional<Customer> findByPhone(String phone);
    Optional<Customer> findByEmail(String email);
    boolean existsByPhone(String phone);

    // Birthdays this month
    @Query("SELECT c FROM Customer c WHERE MONTH(c.dateOfBirth) = :month AND c.active = true")
    List<Customer> findBirthdaysInMonth(@Param("month") int month);

    // Anniversaries this month
    @Query("SELECT c FROM Customer c WHERE MONTH(c.anniversaryDate) = :month AND c.active = true")
    List<Customer> findAnniversariesInMonth(@Param("month") int month);

    // Top customers by spend
    @Query("SELECT c FROM Customer c WHERE c.branch.id = :branchId ORDER BY c.totalSpend DESC")
    List<Customer> findTopByBranch(@Param("branchId") Long branchId);

    // Search by name or phone
    @Query("SELECT c FROM Customer c WHERE c.active = true AND " +
            "(LOWER(c.name) LIKE LOWER(CONCAT('%',:q,'%')) OR c.phone LIKE CONCAT('%',:q,'%'))")
    List<Customer> search(@Param("q") String query);

    long countByBranchId(Long branchId);
}