package com.wealthmap.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Base64;
import java.util.concurrent.atomic.AtomicLong;

@Service
@Slf4j
public class GeminiService {

    @Value("${gemini.api.key:}")
    private String apiKey;

    @Value("${gemini.model:gemini-1.5-flash}")
    private String modelName;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    // Simple throttle tracking to respect free-tier rate limits (15 RPM)
    private static final AtomicLong LAST_REQUEST_TIME = new AtomicLong(0);
    private static final long MIN_REQUEST_INTERVAL_MS = 1500; // at least 1.5s between requests

    private void applyRateLimiting() {
        long now = System.currentTimeMillis();
        long last = LAST_REQUEST_TIME.get();
        long diff = now - last;
        if (diff < MIN_REQUEST_INTERVAL_MS) {
            try {
                Thread.sleep(MIN_REQUEST_INTERVAL_MS - diff);
            } catch (InterruptedException ignored) {
                Thread.currentThread().interrupt();
            }
        }
        LAST_REQUEST_TIME.set(System.currentTimeMillis());
    }

    public boolean isConfigured() {
        return apiKey != null && !apiKey.trim().isEmpty() && !apiKey.startsWith("your-");
    }

    /**
     * Generates a plain text response from Gemini
     */
    public String generateText(String prompt) {
        if (!isConfigured()) {
            return null;
        }

        try {
            applyRateLimiting();
            String endpoint = String.format("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s", modelName, apiKey);

            ObjectNode root = objectMapper.createObjectNode();
            ArrayNode contents = root.putArray("contents");
            ObjectNode contentObj = contents.addObject();
            ArrayNode parts = contentObj.putArray("parts");
            parts.addObject().put("text", prompt);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<String> entity = new HttpEntity<>(objectMapper.writeValueAsString(root), headers);

            ResponseEntity<String> response = restTemplate.exchange(endpoint, HttpMethod.POST, entity, String.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode resJson = objectMapper.readTree(response.getBody());
                JsonNode candidates = resJson.path("candidates");
                if (candidates.isArray() && !candidates.isEmpty()) {
                    return candidates.get(0).path("content").path("parts").get(0).path("text").asText();
                }
            }
        } catch (Exception e) {
            log.error("Gemini API call failed: {}", e.getMessage());
        }
        return null;
    }

    /**
     * Generates a strictly formatted JSON response from Gemini
     */
    public JsonNode generateStructuredJson(String prompt) {
        if (!isConfigured()) {
            return null;
        }

        try {
            applyRateLimiting();
            String endpoint = String.format("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s", modelName, apiKey);

            ObjectNode root = objectMapper.createObjectNode();
            
            // Set generationConfig for application/json
            ObjectNode genConfig = root.putObject("generationConfig");
            genConfig.put("response_mime_type", "application/json");

            ArrayNode contents = root.putArray("contents");
            ObjectNode contentObj = contents.addObject();
            ArrayNode parts = contentObj.putArray("parts");
            parts.addObject().put("text", prompt);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<String> entity = new HttpEntity<>(objectMapper.writeValueAsString(root), headers);

            ResponseEntity<String> response = restTemplate.exchange(endpoint, HttpMethod.POST, entity, String.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode resJson = objectMapper.readTree(response.getBody());
                JsonNode candidates = resJson.path("candidates");
                if (candidates.isArray() && !candidates.isEmpty()) {
                    String rawText = candidates.get(0).path("content").path("parts").get(0).path("text").asText();
                    return objectMapper.readTree(rawText);
                }
            }
        } catch (Exception e) {
            log.error("Gemini structured JSON call failed: {}", e.getMessage());
        }
        return null;
    }

    /**
     * Multimodal document parsing (PDF or image) with Gemini Vision
     */
    public JsonNode generateVisionJson(byte[] fileBytes, String mimeType, String prompt) {
        if (!isConfigured() || fileBytes == null || fileBytes.length == 0) {
            return null;
        }

        try {
            applyRateLimiting();
            String endpoint = String.format("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s", modelName, apiKey);

            ObjectNode root = objectMapper.createObjectNode();
            ObjectNode genConfig = root.putObject("generationConfig");
            genConfig.put("response_mime_type", "application/json");

            ArrayNode contents = root.putArray("contents");
            ObjectNode contentObj = contents.addObject();
            ArrayNode parts = contentObj.putArray("parts");
            
            // Instruction part
            parts.addObject().put("text", prompt);

            // Inline data part (Base64 file)
            ObjectNode inlineData = parts.addObject().putObject("inline_data");
            inlineData.put("mime_type", mimeType != null ? mimeType : "application/pdf");
            inlineData.put("data", Base64.getEncoder().encodeToString(fileBytes));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<String> entity = new HttpEntity<>(objectMapper.writeValueAsString(root), headers);

            ResponseEntity<String> response = restTemplate.exchange(endpoint, HttpMethod.POST, entity, String.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode resJson = objectMapper.readTree(response.getBody());
                JsonNode candidates = resJson.path("candidates");
                if (candidates.isArray() && !candidates.isEmpty()) {
                    String rawText = candidates.get(0).path("content").path("parts").get(0).path("text").asText();
                    return objectMapper.readTree(rawText);
                }
            }
        } catch (Exception e) {
            log.error("Gemini Vision document parsing failed: {}", e.getMessage());
        }
        return null;
    }
}
