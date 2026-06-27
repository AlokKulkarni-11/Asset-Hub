package com.wealthmap.controller;

import com.wealthmap.dto.request.FamilyMemberRequest;
import com.wealthmap.dto.response.FamilyMemberResponse;
import com.wealthmap.service.FamilyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/family")
@RequiredArgsConstructor
public class FamilyController {

    private final FamilyService familyService;

    @PostMapping
    public ResponseEntity<FamilyMemberResponse> addFamilyMember(
            @Valid @RequestBody FamilyMemberRequest request,
            Authentication authentication) {
        
        String userEmail = authentication.getName();
        FamilyMemberResponse response = familyService.addFamilyMember(request, userEmail);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<FamilyMemberResponse>> getFamilyMembers(Authentication authentication) {
        String userEmail = authentication.getName();
        List<FamilyMemberResponse> response = familyService.getFamilyMembers(userEmail);
        return ResponseEntity.ok(response);
    }
}
