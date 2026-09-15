package com.wealthmap.controller;

import com.wealthmap.dto.request.BondRequest;
import com.wealthmap.dto.response.AssetResponse;
import com.wealthmap.dto.response.BondResponse;
import com.wealthmap.service.assets.BondService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/assets/bonds")
@RequiredArgsConstructor
public class BondController {

    private final BondService bondService;
    private final com.wealthmap.service.AuditLogService auditLogService;

    @PostMapping
    public ResponseEntity<AssetResponse> addBond(
            @Valid @RequestBody BondRequest request,
            Authentication authentication) {
        String userEmail = authentication.getName();
        AssetResponse response = bondService.addBond(request, userEmail);
        auditLogService.log(userEmail, "ADD_ASSET", "BOND", response.getId(), "Added Bond: " + request.getName());
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<AssetResponse>> getAllBonds(Authentication authentication) {
        String userEmail = authentication.getName();
        List<AssetResponse> response = bondService.getAllBondsForUser(userEmail);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<BondResponse> getBond(@PathVariable Long id, Authentication authentication) {
        String userEmail = authentication.getName();
        BondResponse response = bondService.getBondById(id, userEmail);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<BondResponse> updateBond(
            @PathVariable Long id,
            @Valid @RequestBody BondRequest request,
            Authentication authentication) {
        String userEmail = authentication.getName();
        BondResponse response = bondService.updateBond(id, request, userEmail);
        auditLogService.log(userEmail, "UPDATE_ASSET", "BOND", response.getId(), "Updated Bond: " + request.getName());
        return ResponseEntity.ok(response);
    }
}
