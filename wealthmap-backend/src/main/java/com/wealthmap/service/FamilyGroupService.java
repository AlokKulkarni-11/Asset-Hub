package com.wealthmap.service;

import com.wealthmap.entity.FamilyGroup;
import com.wealthmap.entity.User;
import com.wealthmap.repository.FamilyGroupRepository;
import com.wealthmap.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
public class FamilyGroupService {

    @Autowired
    private FamilyGroupRepository familyGroupRepository;
    
    @Autowired
    private UserRepository userRepository;

    @Transactional
    public FamilyGroup createFamily(Long creatorId, String familyName) {
        User creator = userRepository.findById(creatorId)
                .orElseThrow(() -> new RuntimeException("User not found"));
                
        if (creator.getFamilyGroup() != null) {
            throw new RuntimeException("User is already in a family group");
        }

        FamilyGroup group = new FamilyGroup();
        group.setName(familyName);
        group.setCreatorId(creatorId);
        // Generate a simple 6 character alphanumeric invite code
        group.setInviteCode(UUID.randomUUID().toString().substring(0, 6).toUpperCase());
        
        FamilyGroup savedGroup = familyGroupRepository.save(group);
        
        // Add creator to group
        creator.setFamilyGroup(savedGroup);
        userRepository.save(creator);
        
        return savedGroup;
    }

    @Transactional
    public FamilyGroup joinFamilyByCode(Long userId, String inviteCode) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
                
        if (user.getFamilyGroup() != null) {
            throw new RuntimeException("User is already in a family group");
        }

        FamilyGroup group = familyGroupRepository.findByInviteCode(inviteCode)
                .orElseThrow(() -> new RuntimeException("Invalid invite code"));
                
        user.setFamilyGroup(group);
        userRepository.save(user);
        
        return group;
    }

    @Transactional
    public void addMemberByEmail(Long creatorId, String email) {
        User creator = userRepository.findById(creatorId)
                .orElseThrow(() -> new RuntimeException("Creator not found"));
                
        FamilyGroup group = creator.getFamilyGroup();
        if (group == null || !group.getCreatorId().equals(creatorId)) {
            throw new RuntimeException("Only the family creator can add members directly");
        }

        User targetUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("No registered user found with that email"));
                
        if (targetUser.getFamilyGroup() != null) {
            throw new RuntimeException("Target user is already in a family group");
        }

        targetUser.setFamilyGroup(group);
        userRepository.save(targetUser);
    }
}
