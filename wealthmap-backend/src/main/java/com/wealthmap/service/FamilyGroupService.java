package com.wealthmap.service;

import com.wealthmap.entity.FamilyGroup;
import com.wealthmap.entity.FamilyInvite;
import com.wealthmap.entity.User;
import com.wealthmap.repository.FamilyGroupRepository;
import com.wealthmap.repository.FamilyInviteRepository;
import com.wealthmap.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.mail.internet.MimeMessage;

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
    private JavaMailSender mailSender;
    
    @Value("${spring.mail.username:}")
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
        group.setInviteCode(UUID.randomUUID().toString().substring(0, 6).toUpperCase()); // Kept for legacy/db constraints but unused
        
        FamilyGroup savedGroup = familyGroupRepository.save(group);
        
        // Add creator to group
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

        // Optional: Check if user already exists and is in a family
        userRepository.findByEmail(inviteeEmail).ifPresent(u -> {
            if (u.getFamilyGroup() != null) {
                throw new RuntimeException("Target user is already in a family group.");
            }
        });

        // Check if there's already a pending invite
        List<FamilyInvite> existingInvites = familyInviteRepository.findByInviteeEmailAndStatus(inviteeEmail, "PENDING");
        if (!existingInvites.isEmpty()) {
            throw new RuntimeException("An invitation has already been sent to this email.");
        }

        // Create the invite
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

        // Skip email if default credentials are still in place to prevent 60-second timeouts
        if (systemEmail == null || systemEmail.contains("your-email@gmail.com") || systemEmail.isEmpty()) {
            return "Invite created! Email sending is disabled because SMTP is not configured. Share this link manually: " + acceptLink;
        }

        // Send Email asynchronously
        java.util.concurrent.CompletableFuture.runAsync(() -> {
            sendInviteEmail(creator, inviteeName, inviteeEmail, group.getName(), invite.getToken(), acceptLink);
        });
        
        return "Invitation created successfully. An email will be sent in the background. Or share this link manually: " + acceptLink;
    }

    private boolean sendInviteEmail(User creator, String inviteeName, String inviteeEmail, String familyName, String token, String acceptLink) {
        try {
            jakarta.mail.internet.MimeMessage message = mailSender.createMimeMessage();
            org.springframework.mail.javamail.MimeMessageHelper helper = new org.springframework.mail.javamail.MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(inviteeEmail);
            helper.setSubject("You've been invited to join " + familyName + " on Asset Hub!");
            
            // Set Reply-To to the creator's email so replies go directly to them
            helper.setReplyTo(creator.getEmail());
            
            // Since we must send FROM the authenticated system account, we do so:
            if (systemEmail != null && !systemEmail.isEmpty()) {
                helper.setFrom(systemEmail, "Asset Hub Invitations");
            }

            String htmlContent = "<h2>Hello " + inviteeName + ",</h2>" +
                    "<p><b>" + creator.getName() + "</b> (" + creator.getEmail() + ") has invited you to join their family group <b>" + familyName + "</b> on Asset Hub.</p>" +
                    "<p>By joining, you will be able to pool your asset tracking and monitor your family's combined net worth!</p>" +
                    "<br/>" +
                    "<a href=\"" + acceptLink + "\" style=\"background-color:#D4A843; color:black; padding:10px 20px; text-decoration:none; border-radius:5px; font-weight:bold;\">Accept Invitation</a>" +
                    "<br/><br/><p>If the button doesn't work, copy and paste this link into your browser:</p>" +
                    "<p>" + acceptLink + "</p>";

            helper.setText(htmlContent, true);

            mailSender.send(message);
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            System.err.println("Failed to send invitation email. Please check email configuration.");
            return false;
        }
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
