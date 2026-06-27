package com.wealthmap.repository;

import com.wealthmap.entity.FamilyGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FamilyGroupRepository extends JpaRepository<FamilyGroup, Long> {
    Optional<FamilyGroup> findByInviteCode(String inviteCode);
}
