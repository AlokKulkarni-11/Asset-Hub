package com.wealthmap.controller;

import com.wealthmap.dto.request.GoldRequest;
import com.wealthmap.dto.response.AssetResponse;
import com.wealthmap.dto.response.GoldResponse;
import com.wealthmap.service.assets.GoldService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/assets/gold")
@RequiredArgsConstructor
public class GoldController {

    private final GoldService goldService;

    @PostMapping
    public ResponseEntity<AssetResponse> addGold(
            @Valid @RequestBody GoldRequest request,
            Authentication authentication) {
        
        String userEmail = authentication.getName();
        AssetResponse response = goldService.addGold(request, userEmail);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<AssetResponse>> getAllGold(Authentication authentication) {
        String userEmail = authentication.getName();
        List<AssetResponse> response = goldService.getAllGoldForUser(userEmail);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<GoldResponse> getGold(@PathVariable Long id, Authentication authentication) {
        String userEmail = authentication.getName();
        GoldResponse response = goldService.getGoldById(id, userEmail);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<GoldResponse> updateGold(
            @PathVariable Long id,
            @Valid @RequestBody GoldRequest request,
            Authentication authentication) {
        String userEmail = authentication.getName();
        GoldResponse response = goldService.updateGold(id, request, userEmail);
        return ResponseEntity.ok(response);
    }
}
