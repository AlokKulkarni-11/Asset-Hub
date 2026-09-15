package com.wealthmap.controller;

import com.wealthmap.dto.request.LiabilityRequest;
import com.wealthmap.dto.response.LiabilityResponse;
import com.wealthmap.service.LiabilityService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/liabilities")
@RequiredArgsConstructor
public class LiabilityController {

    private final LiabilityService liabilityService;
    private final com.wealthmap.service.AuditLogService auditLogService;

    @PostMapping
    public ResponseEntity<LiabilityResponse> addLiability(
            @Valid @RequestBody LiabilityRequest request,
            Authentication authentication) {
        String userEmail = authentication.getName();
        LiabilityResponse response = liabilityService.addLiability(request, userEmail);
        auditLogService.log(userEmail, "ADD_LIABILITY", "LIABILITY", response.getId(), "Added liability: " + request.getName());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<LiabilityResponse> updateLiability(
            @PathVariable Long id,
            @Valid @RequestBody LiabilityRequest request,
            Authentication authentication) {
        String userEmail = authentication.getName();
        LiabilityResponse response = liabilityService.updateLiability(id, request, userEmail);
        auditLogService.log(userEmail, "UPDATE_LIABILITY", "LIABILITY", response.getId(), "Updated liability: " + request.getName());
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<LiabilityResponse>> getAllLiabilities(Authentication authentication) {
        String userEmail = authentication.getName();
        return ResponseEntity.ok(liabilityService.getAllLiabilitiesForUser(userEmail));
    }

    @GetMapping("/{id}")
    public ResponseEntity<LiabilityResponse> getLiability(@PathVariable Long id, Authentication authentication) {
        String userEmail = authentication.getName();
        return ResponseEntity.ok(liabilityService.getLiabilityById(id, userEmail));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLiability(@PathVariable Long id, Authentication authentication) {
        String userEmail = authentication.getName();
        liabilityService.deleteLiability(id, userEmail);
        auditLogService.log(userEmail, "DELETE_LIABILITY", "LIABILITY", id, "Deleted liability ID: " + id);
        return ResponseEntity.ok().build();
    }
}
