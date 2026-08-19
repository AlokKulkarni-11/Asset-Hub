package com.wealthmap.repository;

import com.wealthmap.entity.RebalancingTarget;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RebalancingTargetRepository extends JpaRepository<RebalancingTarget, Long> {
    Optional<RebalancingTarget> findByUserId(Long userId);
}
