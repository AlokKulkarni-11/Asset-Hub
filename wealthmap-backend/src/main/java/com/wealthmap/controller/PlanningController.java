package com.wealthmap.controller;

import com.wealthmap.dto.request.EmergencyFundRequest;
import com.wealthmap.dto.request.RetirementRequest;
import com.wealthmap.dto.response.EmergencyFundResponse;
import com.wealthmap.dto.response.RetirementResponse;
import com.wealthmap.service.PlanningService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/planning")
@RequiredArgsConstructor
public class PlanningController {

    private final PlanningService planningService;

    // --- Emergency Fund ---

    @GetMapping("/emergency-fund")
    public ResponseEntity<EmergencyFundResponse> getEmergencyFund(Authentication authentication) {
        return ResponseEntity.ok(planningService.getEmergencyFund(authentication.getName()));
    }

    @PostMapping("/emergency-fund")
    public ResponseEntity<EmergencyFundResponse> saveEmergencyFund(
            @RequestBody EmergencyFundRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(planningService.saveEmergencyFund(request, authentication.getName()));
    }

    // --- Retirement Calculator ---

    @PostMapping("/retirement")
    public ResponseEntity<RetirementResponse> calculateRetirement(
            @RequestBody RetirementRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(planningService.calculateRetirement(request, authentication.getName()));
    }
}
