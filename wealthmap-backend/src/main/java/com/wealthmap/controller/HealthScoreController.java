package com.wealthmap.controller;

import com.wealthmap.dto.response.HealthScoreResponse;
import com.wealthmap.entity.User;
import com.wealthmap.repository.UserRepository;
import com.wealthmap.service.HealthScoreService;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/health-score")
@RequiredArgsConstructor
public class HealthScoreController {

    private final HealthScoreService healthScoreService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<HealthScoreResponse> getHealthScore(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        HealthScoreResponse response = healthScoreService.calculateHealthScore(user);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh")
    @CacheEvict(value = "healthScore", key = "#authentication.name")
    public ResponseEntity<HealthScoreResponse> refreshHealthScore(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        HealthScoreResponse response = healthScoreService.calculateHealthScore(user);
        return ResponseEntity.ok(response);
    }
}
