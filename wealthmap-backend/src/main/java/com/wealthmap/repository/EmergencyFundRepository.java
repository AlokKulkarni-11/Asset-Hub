package com.wealthmap.repository;

import com.wealthmap.entity.EmergencyFund;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EmergencyFundRepository extends JpaRepository<EmergencyFund, Long> {
    Optional<EmergencyFund> findByUserId(Long userId);
}
