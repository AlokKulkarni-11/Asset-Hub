package com.wealthmap.service;

import com.wealthmap.entity.FamilyGroup;
import com.wealthmap.entity.FamilyInvite;
import com.wealthmap.entity.User;
import com.wealthmap.repository.FamilyGroupRepository;
import com.wealthmap.repository.FamilyInviteRepository;
import com.wealthmap.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class FamilyGroupService {

    @Autowired
    private FamilyGroupRepository familyGroupRepository;
    
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FamilyInviteRepository familyInviteRepository;

    @Autowired
    private EmailService emailService;
    
    @Value("${brevo.sender.email:}")
    private String systemEmail;

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
        group.setInviteCode(UUID.randomUUID().toString().substring(0, 6).toUpperCase());
        
        FamilyGroup savedGroup = familyGroupRepository.save(group);
        
        creator.setFamilyGroup(savedGroup);
        userRepository.save(creator);
        
        return savedGroup;
    }

    @Transactional
    public String inviteMember(Long creatorId, String inviteeName, String inviteeEmail) {
        User creator = userRepository.findById(creatorId)
                .orElseThrow(() -> new RuntimeException("Creator not found"));
                
        FamilyGroup group = creator.getFamilyGroup();
        if (group == null || !group.getCreatorId().equals(creatorId)) {
            throw new RuntimeException("Only the family creator can invite members.");
        }

        userRepository.findByEmail(inviteeEmail).ifPresent(u -> {
            if (u.getFamilyGroup() != null) {
                throw new RuntimeException("Target user is already in a family group.");
            }
        });

        List<FamilyInvite> existingInvites = familyInviteRepository.findByInviteeEmailAndStatus(inviteeEmail, "PENDING");
        if (!existingInvites.isEmpty()) {
            throw new RuntimeException("An invitation has already been sent to this email.");
        }

        FamilyInvite invite = new FamilyInvite();
        invite.setFamilyGroup(group);
        invite.setInviteeEmail(inviteeEmail);
        invite.setInviteeName(inviteeName);
        invite.setToken(UUID.randomUUID().toString());
        invite.setStatus("PENDING");

        familyInviteRepository.save(invite);

        String frontendUrl = System.getenv("FRONTEND_URL");
        if (frontendUrl == null || frontendUrl.isEmpty()) {
            frontendUrl = "https://asset-hub-3jo7.vercel.app";
        }
        String acceptLink = frontendUrl + "/family?invite_token=" + invite.getToken();

        if (systemEmail == null || systemEmail.isEmpty()) {
            return "Invite created! Email sending is disabled because API key is not configured. Share this link manually: " + acceptLink;
        }

        // Send Email asynchronously
        java.util.concurrent.CompletableFuture.runAsync(() -> {
            emailService.sendFamilyInviteEmail(inviteeEmail, inviteeName, creator.getName(), creator.getEmail(), group.getName(), acceptLink);
        });
        
        return "Invitation created successfully. An email will be sent in the background. Or share this link manually: " + acceptLink;
    }

    @Transactional
    public FamilyGroup acceptInvite(Long userId, String token) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getFamilyGroup() != null) {
            throw new RuntimeException("You are already in a family group.");
        }

        FamilyInvite invite = familyInviteRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid or expired invitation token."));

        if (!invite.getStatus().equals("PENDING")) {
            throw new RuntimeException("This invitation has already been processed.");
        }

        // Technically we should check if invite.getInviteeEmail() matches user.getEmail(), 
        // but for usability we can allow them to accept it with their registered account.
        if (!user.getEmail().equalsIgnoreCase(invite.getInviteeEmail())) {
            throw new RuntimeException("This invite was sent to a different email address.");
        }

        FamilyGroup group = invite.getFamilyGroup();
        user.setFamilyGroup(group);
        userRepository.save(user);

        invite.setStatus("ACCEPTED");
        familyInviteRepository.save(invite);

        return group;
    }

    public List<FamilyInvite> getMyPendingInvites(String email) {
        return familyInviteRepository.findByInviteeEmailAndStatus(email, "PENDING");
    }

    @Transactional
    public void leaveFamily(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getFamilyGroup() == null) {
            throw new RuntimeException("You are not in a family group.");
        }

        user.setFamilyGroup(null);
        userRepository.save(user);
    }
}
