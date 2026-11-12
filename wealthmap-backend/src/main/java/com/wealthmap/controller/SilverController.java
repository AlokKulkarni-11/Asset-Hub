package com.wealthmap.controller;

import com.wealthmap.dto.request.SilverRequest;
import com.wealthmap.dto.response.AssetResponse;
import com.wealthmap.dto.response.SilverResponse;
import com.wealthmap.service.assets.SilverService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/assets/silver")
@RequiredArgsConstructor
public class SilverController {

    private final SilverService silverService;
    private final com.wealthmap.service.AuditLogService auditLogService;

    @PostMapping
    public ResponseEntity<AssetResponse> addSilver(
            @Valid @RequestBody SilverRequest request,
            Authentication authentication) {
        String userEmail = authentication.getName();
        AssetResponse response = silverService.addSilver(request, userEmail);
        auditLogService.log(userEmail, "ADD_ASSET", "SILVER", response.getId(), "Added silver: " + request.getWeightGrams() + "g");
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<AssetResponse>> getAllSilver(Authentication authentication) {
        String userEmail = authentication.getName();
        List<AssetResponse> response = silverService.getAllSilverForUser(userEmail);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<SilverResponse> getSilver(@PathVariable Long id, Authentication authentication) {
        String userEmail = authentication.getName();
        SilverResponse response = silverService.getSilverById(id, userEmail);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<SilverResponse> updateSilver(
            @PathVariable Long id,
            @Valid @RequestBody SilverRequest request,
            Authentication authentication) {
        String userEmail = authentication.getName();
        SilverResponse response = silverService.updateSilver(id, request, userEmail);
        auditLogService.log(userEmail, "UPDATE_ASSET", "SILVER", response.getId(), "Updated silver weight to " + request.getWeightGrams() + "g");
        return ResponseEntity.ok(response);
    }
}
