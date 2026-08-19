package com.wealthmap.repository;

import com.wealthmap.entity.base.Liability;
import com.wealthmap.enums.LiabilityType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LiabilityRepository extends JpaRepository<Liability, Long> {
    List<Liability> findByUserId(Long userId);
    List<Liability> findByUserIdAndLiabilityType(Long userId, LiabilityType liabilityType);
}
