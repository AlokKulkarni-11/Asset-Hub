package com.wealthmap.controller;

import com.wealthmap.dto.request.PriceAlertRequest;
import com.wealthmap.dto.request.RebalancingRequest;
import com.wealthmap.dto.response.NotificationResponse;
import com.wealthmap.dto.response.PriceAlertResponse;
import com.wealthmap.dto.response.RebalancingResponse;
import com.wealthmap.service.AlertService;
import com.wealthmap.service.RebalancingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/alerts")
@RequiredArgsConstructor
public class AlertController {

    private final AlertService alertService;
    private final RebalancingService rebalancingService;

    @GetMapping("/price")
    public ResponseEntity<List<PriceAlertResponse>> getPriceAlerts(Authentication authentication) {
        return ResponseEntity.ok(alertService.getUserAlerts(authentication.getName()));
    }

    @PostMapping("/price")
    public ResponseEntity<PriceAlertResponse> createPriceAlert(@RequestBody PriceAlertRequest request, Authentication authentication) {
        return ResponseEntity.ok(alertService.createPriceAlert(request, authentication.getName()));
    }

    @DeleteMapping("/price/{id}")
    public ResponseEntity<Void> deletePriceAlert(@PathVariable Long id, Authentication authentication) {
        alertService.deleteAlert(id, authentication.getName());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/notifications")
    public ResponseEntity<List<NotificationResponse>> getNotifications(Authentication authentication) {
        return ResponseEntity.ok(alertService.getUserNotifications(authentication.getName()));
    }

    @PostMapping("/notifications/{id}/read")
    public ResponseEntity<Void> markNotificationRead(@PathVariable Long id, Authentication authentication) {
        alertService.markNotificationRead(id, authentication.getName());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/rebalancing")
    public ResponseEntity<RebalancingResponse> getRebalancing(Authentication authentication) {
        return ResponseEntity.ok(rebalancingService.getStatus(authentication.getName()));
    }

    @PostMapping("/rebalancing")
    public ResponseEntity<RebalancingResponse> saveRebalancing(@RequestBody RebalancingRequest request, Authentication authentication) {
        return ResponseEntity.ok(rebalancingService.saveTarget(request, authentication.getName()));
    }
}
