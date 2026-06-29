package com.wealthmap.controller;

import lombok.Data;

import com.wealthmap.entity.FamilyGroup;
import com.wealthmap.entity.FamilyInvite;
import com.wealthmap.entity.User;
import com.wealthmap.repository.UserRepository;
import com.wealthmap.service.FamilyGroupService;
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

    @PostMapping("/create")
    public ResponseEntity<?> createFamily(Authentication authentication, @RequestBody CreateFamilyRequest req) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email).orElseThrow();
        try {
            FamilyGroup group = familyGroupService.createFamily(user.getId(), req.getName());
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
            familyGroupService.acceptInvite(user.getId(), req.getToken());
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
            familyGroupService.leaveFamily(user.getId());
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

        FamilyDetailsResponse response = new FamilyDetailsResponse();
        response.setId(group.getId());
        response.setName(group.getName());
        response.setInviteCode(group.getInviteCode());
        response.setCreatorId(group.getCreatorId());
        
        List<MemberResponse> memberResponses = members.stream().map(m -> {
            MemberResponse mr = new MemberResponse();
            mr.setId(m.getId());
            mr.setName(m.getName());
            mr.setEmail(m.getEmail());
            return mr;
        }).collect(Collectors.toList());
        
        response.setMembers(memberResponses);
        return ResponseEntity.ok(response);
    }

    @Autowired
    private com.wealthmap.service.assets.GoldService goldService;
    
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
            familyAssets.addAll(fdService.getAllFDsForUser(member.getEmail()));
            familyAssets.addAll(stockService.getAllStocksForUser(member.getEmail()));
            familyAssets.addAll(mfService.getAllMutualFundsForUser(member.getEmail()));
            familyAssets.addAll(reService.getAllRealEstateForUser(member.getEmail()));
        }

        return ResponseEntity.ok(familyAssets);
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
    private List<MemberResponse> members;
}

@Data
class MemberResponse {
    private Long id;
    private String name;
    private String email;
}
