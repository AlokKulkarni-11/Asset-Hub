package com.wealthmap.controller;

import com.wealthmap.dto.request.AiChatRequest;
import com.wealthmap.dto.request.AiParseAssetRequest;
import com.wealthmap.dto.request.AnomalyCheckRequest;
import com.wealthmap.dto.response.AiChatResponse;
import com.wealthmap.dto.response.AiParseAssetResponse;
import com.wealthmap.dto.response.AnomalyCheckResponse;
import com.wealthmap.entity.User;
import com.wealthmap.repository.UserRepository;
import com.wealthmap.service.AiAssistantService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiAssistantService aiAssistantService;
    private final UserRepository userRepository;

    @PostMapping("/parse-asset")
    public ResponseEntity<AiParseAssetResponse> parseAsset(@Valid @RequestBody AiParseAssetRequest request) {
        AiParseAssetResponse response = aiAssistantService.parseNaturalLanguageAsset(request.getText());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/narrative")
    public ResponseEntity<Map<String, String>> getNarrative(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        String narrative = aiAssistantService.generatePortfolioNarrative(user);
        return ResponseEntity.ok(Collections.singletonMap("narrative", narrative));
    }

    @PostMapping("/narrative/refresh")
    @CacheEvict(value = "aiNarrative", key = "#authentication.name")
    public ResponseEntity<Map<String, String>> refreshNarrative(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        String narrative = aiAssistantService.generatePortfolioNarrative(user);
        return ResponseEntity.ok(Collections.singletonMap("narrative", narrative));
    }

    @PostMapping("/chat")
    public ResponseEntity<AiChatResponse> chat(Authentication authentication, @RequestBody AiChatRequest request) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        AiChatResponse response = aiAssistantService.chat(user, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/anomaly-check")
    public ResponseEntity<AnomalyCheckResponse> checkAnomaly(@RequestBody AnomalyCheckRequest request) {
        AnomalyCheckResponse response = aiAssistantService.detectAnomalies(request);
        return ResponseEntity.ok(response);
    }
}
