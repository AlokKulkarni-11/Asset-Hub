package com.wealthmap.repository;

import com.wealthmap.entity.FamilyInvite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FamilyInviteRepository extends JpaRepository<FamilyInvite, Long> {
    Optional<FamilyInvite> findByToken(String token);
    List<FamilyInvite> findByInviteeEmailAndStatus(String inviteeEmail, String status);
}
