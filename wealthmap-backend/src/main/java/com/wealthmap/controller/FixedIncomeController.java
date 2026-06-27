package com.wealthmap.controller;

import com.wealthmap.dto.request.FixedDepositRequest;
import com.wealthmap.dto.response.AssetResponse;
import com.wealthmap.dto.response.FixedDepositResponse;
import com.wealthmap.service.assets.FixedDepositService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/assets/fd")
@RequiredArgsConstructor
public class FixedIncomeController {

    private final FixedDepositService fixedDepositService;

    @PostMapping
    public ResponseEntity<AssetResponse> addFD(
            @Valid @RequestBody FixedDepositRequest request,
            Authentication authentication) {
        
        String userEmail = authentication.getName();
        AssetResponse response = fixedDepositService.addFD(request, userEmail);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<AssetResponse>> getAllFDs(Authentication authentication) {
        String userEmail = authentication.getName();
        List<AssetResponse> response = fixedDepositService.getAllFDsForUser(userEmail);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<FixedDepositResponse> getFD(@PathVariable Long id, Authentication authentication) {
        String userEmail = authentication.getName();
        FixedDepositResponse response = fixedDepositService.getFDById(id, userEmail);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<FixedDepositResponse> updateFD(
            @PathVariable Long id,
            @Valid @RequestBody FixedDepositRequest request,
            Authentication authentication) {
        String userEmail = authentication.getName();
        FixedDepositResponse response = fixedDepositService.updateFD(id, request, userEmail);
        return ResponseEntity.ok(response);
    }
}
