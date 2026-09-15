package com.wealthmap.controller;

import com.wealthmap.dto.request.EsopRsuRequest;
import com.wealthmap.dto.response.AssetResponse;
import com.wealthmap.dto.response.EsopRsuResponse;
import com.wealthmap.service.assets.EsopRsuService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/assets/esops")
@RequiredArgsConstructor
public class EsopRsuController {

    private final EsopRsuService esopRsuService;
    private final com.wealthmap.service.AuditLogService auditLogService;

    @PostMapping
    public ResponseEntity<AssetResponse> addEsopRsu(
            @Valid @RequestBody EsopRsuRequest request,
            Authentication authentication) {
        String userEmail = authentication.getName();
        AssetResponse response = esopRsuService.addEsopRsu(request, userEmail);
        auditLogService.log(userEmail, "ADD_ASSET", "ESOP_RSU", response.getId(), "Added " + request.getPlanType() + ": " + request.getName());
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<AssetResponse>> getAllEsopRsus(Authentication authentication) {
        String userEmail = authentication.getName();
        List<AssetResponse> response = esopRsuService.getAllEsopRsusForUser(userEmail);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<EsopRsuResponse> getEsopRsu(@PathVariable Long id, Authentication authentication) {
        String userEmail = authentication.getName();
        EsopRsuResponse response = esopRsuService.getEsopRsuById(id, userEmail);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<EsopRsuResponse> updateEsopRsu(
            @PathVariable Long id,
            @Valid @RequestBody EsopRsuRequest request,
            Authentication authentication) {
        String userEmail = authentication.getName();
        EsopRsuResponse response = esopRsuService.updateEsopRsu(id, request, userEmail);
        auditLogService.log(userEmail, "UPDATE_ASSET", "ESOP_RSU", response.getId(), "Updated " + request.getPlanType() + ": " + request.getName());
        return ResponseEntity.ok(response);
    }
}
