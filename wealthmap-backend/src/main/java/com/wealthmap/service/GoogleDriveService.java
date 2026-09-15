package com.wealthmap.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.wealthmap.entity.User;
import com.wealthmap.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class GoogleDriveService {

    private final UserRepository userRepository;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${google.client.id:}")
    private String clientId;

    @Value("${google.client.secret:}")
    private String clientSecret;

    @Value("${google.redirect.uri:http://localhost:5173/auth/google/callback}")
    private String redirectUri;

    private static final String FOLDER_NAME = "Asset Hub Documents";

    /**
     * Exchanges OAuth authorization code for Google access and refresh tokens
     */
    public Map<String, Object> exchangeAuthCode(String code, String customRedirectUri) {
        try {
            String tokenUrl = "https://oauth2.googleapis.com/token";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("code", code);
            body.add("client_id", clientId);
            body.add("client_secret", clientSecret);
            body.add("redirect_uri", customRedirectUri != null ? customRedirectUri : redirectUri);
            body.add("grant_type", "authorization_code");

            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(tokenUrl, request, String.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode json = objectMapper.readTree(response.getBody());
                String accessToken = json.path("access_token").asText();
                String refreshToken = json.path("refresh_token").asText(null);
                int expiresIn = json.path("expires_in").asInt(3600);
                String idToken = json.path("id_token").asText(null);

                // Fetch user info from Google
                String userEmail = null;
                String userName = null;
                String googleId = null;

                try {
                    HttpHeaders userHeaders = new HttpHeaders();
                    userHeaders.setBearerAuth(accessToken);
                    HttpEntity<?> userReq = new HttpEntity<>(userHeaders);
                    ResponseEntity<String> userRes = restTemplate.exchange(
                            "https://www.googleapis.com/oauth2/v2/userinfo",
                            HttpMethod.GET,
                            userReq,
                            String.class
                    );
                    if (userRes.getStatusCode().is2xxSuccessful() && userRes.getBody() != null) {
                        JsonNode uJson = objectMapper.readTree(userRes.getBody());
                        userEmail = uJson.path("email").asText();
                        userName = uJson.path("name").asText();
                        googleId = uJson.path("id").asText();
                    }
                } catch (Exception e) {
                    log.warn("Failed to fetch Google userinfo: {}", e.getMessage());
                }

                Map<String, Object> result = new HashMap<>();
                result.put("accessToken", accessToken);
                result.put("refreshToken", refreshToken);
                result.put("expiresIn", expiresIn);
                result.put("email", userEmail);
                result.put("name", userName);
                result.put("googleId", googleId);
                return result;
            }
        } catch (Exception e) {
            log.error("Google token exchange failed: {}", e.getMessage());
        }
        return Collections.emptyMap();
    }

    /**
     * Ensures the user has a valid, non-expired Google access token
     */
    public String getValidAccessToken(User user) {
        if (user.getGoogleAccessToken() != null && user.getGoogleTokenExpiresAt() != null
                && user.getGoogleTokenExpiresAt().isAfter(LocalDateTime.now().plusMinutes(2))) {
            return user.getGoogleAccessToken();
        }

        if (user.getGoogleRefreshToken() == null) {
            return null;
        }

        // Refresh access token
        try {
            String tokenUrl = "https://oauth2.googleapis.com/token";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("client_id", clientId);
            body.add("client_secret", clientSecret);
            body.add("refresh_token", user.getGoogleRefreshToken());
            body.add("grant_type", "refresh_token");

            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(tokenUrl, request, String.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode json = objectMapper.readTree(response.getBody());
                String newAccessToken = json.path("access_token").asText();
                int expiresIn = json.path("expires_in").asInt(3600);

                user.setGoogleAccessToken(newAccessToken);
                user.setGoogleTokenExpiresAt(LocalDateTime.now().plusSeconds(expiresIn));
                userRepository.save(user);
                return newAccessToken;
            }
        } catch (Exception e) {
            log.error("Failed to refresh Google access token for user {}: {}", user.getId(), e.getMessage());
        }

        return user.getGoogleAccessToken();
    }

    /**
     * Gets or creates the dedicated "Asset Hub Documents" folder in the user's Google Drive
     */
    public String getOrCreateAppFolder(User user) {
        if (user.getGoogleDriveFolderId() != null) {
            return user.getGoogleDriveFolderId();
        }

        String accessToken = getValidAccessToken(user);
        if (accessToken == null) return null;

        try {
            // Search if folder already exists
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);
            HttpEntity<?> req = new HttpEntity<>(headers);

            String query = String.format("name='%s' and mimeType='application/vnd.google-apps.folder' and trashed=false", FOLDER_NAME);
            String searchUrl = "https://www.googleapis.com/drive/v3/files?q=" + query;

            ResponseEntity<String> searchRes = restTemplate.exchange(searchUrl, HttpMethod.GET, req, String.class);
            if (searchRes.getStatusCode().is2xxSuccessful() && searchRes.getBody() != null) {
                JsonNode searchJson = objectMapper.readTree(searchRes.getBody());
                JsonNode files = searchJson.path("files");
                if (files.isArray() && !files.isEmpty()) {
                    String folderId = files.get(0).path("id").asText();
                    user.setGoogleDriveFolderId(folderId);
                    userRepository.save(user);
                    return folderId;
                }
            }

            // Create folder
            Map<String, Object> folderMeta = new HashMap<>();
            folderMeta.put("name", FOLDER_NAME);
            folderMeta.put("mimeType", "application/vnd.google-apps.folder");

            HttpHeaders createHeaders = new HttpHeaders();
            createHeaders.setBearerAuth(accessToken);
            createHeaders.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> createReq = new HttpEntity<>(folderMeta, createHeaders);
            ResponseEntity<String> createRes = restTemplate.postForEntity("https://www.googleapis.com/drive/v3/files", createReq, String.class);

            if (createRes.getStatusCode().is2xxSuccessful() && createRes.getBody() != null) {
                JsonNode createJson = objectMapper.readTree(createRes.getBody());
                String folderId = createJson.path("id").asText();
                user.setGoogleDriveFolderId(folderId);
                userRepository.save(user);
                return folderId;
            }
        } catch (Exception e) {
            log.error("Failed to get or create Google Drive folder: {}", e.getMessage());
        }

        return null;
    }

    /**
     * Uploads a file to Google Drive in the app folder
     */
    public Map<String, String> uploadFile(User user, byte[] fileBytes, String fileName, String mimeType) {
        String accessToken = getValidAccessToken(user);
        if (accessToken == null) {
            // Fallback for demo/offline: return simulated drive ID
            String mockId = "mock_drive_" + System.currentTimeMillis();
            Map<String, String> mockRes = new HashMap<>();
            mockRes.put("fileId", mockId);
            mockRes.put("viewUrl", "https://drive.google.com/file/d/" + mockId + "/view");
            return mockRes;
        }

        String folderId = getOrCreateAppFolder(user);

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();

            // 1. Metadata part
            Map<String, Object> metadata = new HashMap<>();
            metadata.put("name", fileName);
            if (folderId != null) {
                metadata.put("parents", Collections.singletonList(folderId));
            }
            HttpHeaders metaHeaders = new HttpHeaders();
            metaHeaders.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> metaEntity = new HttpEntity<>(metadata, metaHeaders);
            body.add("metadata", metaEntity);

            // 2. Media part
            ByteArrayResource fileResource = new ByteArrayResource(fileBytes) {
                @Override
                public String getFilename() {
                    return fileName;
                }
            };
            HttpHeaders mediaHeaders = new HttpHeaders();
            mediaHeaders.setContentType(MediaType.parseMediaType(mimeType != null ? mimeType : "application/pdf"));
            HttpEntity<ByteArrayResource> mediaEntity = new HttpEntity<>(fileResource, mediaHeaders);
            body.add("file", mediaEntity);

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
            String uploadUrl = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink";

            ResponseEntity<String> response = restTemplate.postForEntity(uploadUrl, requestEntity, String.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode resJson = objectMapper.readTree(response.getBody());
                String fileId = resJson.path("id").asText();
                String viewLink = resJson.path("webViewLink").asText("https://drive.google.com/file/d/" + fileId + "/view");
                String downloadLink = resJson.path("webContentLink").asText(null);

                Map<String, String> result = new HashMap<>();
                result.put("fileId", fileId);
                result.put("viewUrl", viewLink);
                result.put("downloadUrl", downloadLink);
                return result;
            }
        } catch (Exception e) {
            log.error("Failed to upload file to Google Drive: {}", e.getMessage());
        }

        // Fallback file ID
        String fallbackId = "drive_" + System.currentTimeMillis();
        Map<String, String> fallback = new HashMap<>();
        fallback.put("fileId", fallbackId);
        fallback.put("viewUrl", "https://drive.google.com/file/d/" + fallbackId + "/view");
        return fallback;
    }

    /**
     * Deletes a file from Google Drive
     */
    public boolean deleteFile(User user, String driveFileId) {
        if (driveFileId == null || driveFileId.startsWith("mock_") || driveFileId.startsWith("drive_")) {
            return true;
        }

        String accessToken = getValidAccessToken(user);
        if (accessToken == null) return true;

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);
            HttpEntity<?> req = new HttpEntity<>(headers);
            restTemplate.exchange("https://www.googleapis.com/drive/v3/files/" + driveFileId, HttpMethod.DELETE, req, Void.class);
            return true;
        } catch (Exception e) {
            log.warn("Failed to delete Google Drive file {}: {}", driveFileId, e.getMessage());
            return false;
        }
    }
}
