package com.wealthmap.controller;

import lombok.Data;

import com.wealthmap.entity.FamilyGroup;
import com.wealthmap.entity.FamilyInvite;
import com.wealthmap.entity.User;
import com.wealthmap.repository.UserRepository;
import com.wealthmap.service.FamilyGroupService;
import com.wealthmap.service.FamilyRollupService;
import org.springframework.security.core.Authentication;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/family")
@CrossOrigin(origins = "*")
public class FamilyGroupController {

    @Autowired
    private FamilyGroupService familyGroupService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FamilyRollupService familyRollupService;

    @Autowired
    private com.wealthmap.service.AuditLogService auditLogService;

    @PostMapping("/create")
    public ResponseEntity<?> createFamily(Authentication authentication, @RequestBody CreateFamilyRequest req) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email).orElseThrow();
        try {
            FamilyGroup group = familyGroupService.createFamily(user.getId(), req.getName());
            auditLogService.log(email, "CREATE_FAMILY", "FAMILY_GROUP", group.getId(), "Created family group: " + req.getName());
            return ResponseEntity.ok(group);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/invite")
    public ResponseEntity<?> inviteMember(Authentication authentication, @RequestBody InviteMemberRequest req) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email).orElseThrow();
        try {
            String message = familyGroupService.inviteMember(user.getId(), req.getName(), req.getEmail());
            if (user.getFamilyGroup() != null) {
                auditLogService.log(email, "INVITE_MEMBER", "FAMILY_GROUP", user.getFamilyGroup().getId(), "Invited member: " + req.getName() + " (" + req.getEmail() + ")");
            }
            return ResponseEntity.ok(message);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/accept-invite")
    public ResponseEntity<?> acceptInvite(Authentication authentication, @RequestBody AcceptInviteRequest req) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email).orElseThrow();
        try {
            FamilyGroup group = familyGroupService.acceptInvite(user.getId(), req.getToken());
            auditLogService.log(email, "JOIN_FAMILY", "FAMILY_GROUP", group.getId(), "Joined family group: " + group.getName());
            return ResponseEntity.ok("Successfully joined the family.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/leave")
    public ResponseEntity<?> leaveFamily(Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email).orElseThrow();
        try {
            FamilyGroup group = user.getFamilyGroup();
            familyGroupService.leaveFamily(user.getId());
            if (group != null) {
                auditLogService.log(email, "LEAVE_FAMILY", "FAMILY_GROUP", group.getId(), "Left family group: " + group.getName());
            }
            return ResponseEntity.ok("Successfully left the family.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/invites")
    public ResponseEntity<?> getMyInvites(Authentication authentication) {
        String email = authentication.getName();
        try {
            List<FamilyInvite> invites = familyGroupService.getMyPendingInvites(email);
            List<InviteResponse> response = invites.stream().map(i -> {
                InviteResponse ir = new InviteResponse();
                ir.setId(i.getId());
                ir.setFamilyName(i.getFamilyGroup().getName());
                ir.setToken(i.getToken());
                ir.setCreatedAt(i.getCreatedAt().toString());
                return ir;
            }).collect(Collectors.toList());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMyFamily(Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email).orElseThrow();
        if (user.getFamilyGroup() == null) {
            return ResponseEntity.noContent().build();
        }
        
        FamilyGroup group = user.getFamilyGroup();
        List<User> members = userRepository.findAll().stream()
                .filter(u -> u.getFamilyGroup() != null && u.getFamilyGroup().getId().equals(group.getId()))
                .collect(Collectors.toList());

        boolean isUserCreator = group.getCreatorId() != null && group.getCreatorId().equals(user.getId());
        if (user.getFamilyRole() == null && isUserCreator) {
            user.setFamilyRole(com.wealthmap.enums.FamilyRole.OWNER);
            userRepository.save(user);
        }

        FamilyDetailsResponse response = new FamilyDetailsResponse();
        response.setId(group.getId());
        response.setName(group.getName());
        response.setInviteCode(group.getInviteCode());
        response.setCreatorId(group.getCreatorId());
        response.setCurrentUserRole(user.getFamilyRole() != null ? user.getFamilyRole().name() : (isUserCreator ? "OWNER" : "EDITOR"));
        
        List<MemberResponse> memberResponses = members.stream().map(m -> {
            MemberResponse mr = new MemberResponse();
            mr.setId(m.getId());
            mr.setName(m.getName());
            mr.setEmail(m.getEmail());
            boolean isMemberCreator = group.getCreatorId() != null && group.getCreatorId().equals(m.getId());
            mr.setFamilyRole(m.getFamilyRole() != null ? m.getFamilyRole().name() : (isMemberCreator ? "OWNER" : "EDITOR"));
            return mr;
        }).collect(Collectors.toList());
        
        response.setMembers(memberResponses);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/update-role")
    public ResponseEntity<?> updateMemberRole(Authentication authentication, @RequestBody UpdateRoleRequest req) {
        String email = authentication.getName();
        User currentUser = userRepository.findByEmail(email).orElseThrow();
        
        if (currentUser.getFamilyGroup() == null) {
            return ResponseEntity.status(400).body("You are not in a family group.");
        }

        boolean isOwner = currentUser.getFamilyRole() == com.wealthmap.enums.FamilyRole.OWNER
                || (currentUser.getFamilyGroup().getCreatorId() != null && currentUser.getFamilyGroup().getCreatorId().equals(currentUser.getId()));

        if (!isOwner) {
            return ResponseEntity.status(403).body("Only the family Owner can update roles.");
        }

        if (currentUser.getFamilyRole() == null && isOwner) {
            currentUser.setFamilyRole(com.wealthmap.enums.FamilyRole.OWNER);
            userRepository.save(currentUser);
        }

        User targetUser = userRepository.findById(req.getUserId())
                .orElseThrow(() -> new RuntimeException("Member not found"));

        if (targetUser.getFamilyGroup() == null || !targetUser.getFamilyGroup().getId().equals(currentUser.getFamilyGroup().getId())) {
            return ResponseEntity.status(400).body("User is not in your family group.");
        }

        if (targetUser.getId().equals(currentUser.getId())) {
            return ResponseEntity.badRequest().body("You cannot change your own role.");
        }

        try {
            com.wealthmap.enums.FamilyRole newRole = com.wealthmap.enums.FamilyRole.valueOf(req.getRole().toUpperCase());
            targetUser.setFamilyRole(newRole);
            userRepository.save(targetUser);
            auditLogService.log(email, "UPDATE_MEMBER_ROLE", "FAMILY_GROUP", currentUser.getFamilyGroup().getId(), "Updated member role of " + targetUser.getName() + " to " + newRole.name());
            return ResponseEntity.ok("Successfully updated member role.");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Invalid family role. Allowed values: OWNER, EDITOR, VIEWER");
        }
    }

    @Autowired
    private com.wealthmap.service.assets.GoldService goldService;

    @Autowired
    private com.wealthmap.service.assets.SilverService silverService;
    
    @Autowired
    private com.wealthmap.service.assets.FixedDepositService fdService;
    
    @Autowired
    private com.wealthmap.service.assets.StockService stockService;

    @Autowired
    private com.wealthmap.service.assets.MutualFundService mfService;

    @Autowired
    private com.wealthmap.service.assets.RealEstateService reService;

    @GetMapping("/assets")
    public ResponseEntity<?> getFamilyAssets(Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email).orElseThrow();
        if (user.getFamilyGroup() == null) {
            return ResponseEntity.badRequest().body("You are not in a family");
        }

        // Get all members of the family
        List<User> members = userRepository.findAll().stream()
                .filter(u -> u.getFamilyGroup() != null && u.getFamilyGroup().getId().equals(user.getFamilyGroup().getId()))
                .collect(Collectors.toList());

        List<com.wealthmap.dto.response.AssetResponse> familyAssets = new java.util.ArrayList<>();
        
        for (User member : members) {
            familyAssets.addAll(goldService.getAllGoldForUser(member.getEmail()));
            familyAssets.addAll(silverService.getAllSilverForUser(member.getEmail()));
            familyAssets.addAll(fdService.getAllFDsForUser(member.getEmail()));
            familyAssets.addAll(stockService.getAllStocksForUser(member.getEmail()));
            familyAssets.addAll(mfService.getAllMutualFundsForUser(member.getEmail()));
            familyAssets.addAll(reService.getAllRealEstateForUser(member.getEmail()));
        }

        return ResponseEntity.ok(familyAssets);
    }

    @GetMapping("/rollup")
    public ResponseEntity<?> getFamilyRollup(Authentication authentication) {
        try {
            return ResponseEntity.ok(familyRollupService.getFamilyRollup(authentication.getName()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}

@Data
class CreateFamilyRequest {
    private String name;
}

@Data
class InviteMemberRequest {
    private String name;
    private String email;
}

@Data
class AcceptInviteRequest {
    private String token;
}

@Data
class InviteResponse {
    private Long id;
    private String familyName;
    private String token;
    private String createdAt;
}

@Data
class FamilyDetailsResponse {
    private Long id;
    private String name;
    private String inviteCode;
    private Long creatorId;
    private String currentUserRole;
    private List<MemberResponse> members;
}

@Data
class MemberResponse {
    private Long id;
    private String name;
    private String email;
    private String familyRole;
}

@Data
class UpdateRoleRequest {
    private Long userId;
    private String role;
}
