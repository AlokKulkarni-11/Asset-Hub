package com.wealthmap.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.wealthmap.dto.response.AssetDocumentResponse;
import com.wealthmap.entity.AssetDocument;
import com.wealthmap.entity.User;
import com.wealthmap.entity.base.Asset;
import com.wealthmap.entity.base.Liability;
import com.wealthmap.repository.AssetDocumentRepository;
import com.wealthmap.repository.AssetRepository;
import com.wealthmap.repository.LiabilityRepository;
import com.wealthmap.repository.UserRepository;
import com.wealthmap.service.GeminiService;
import com.wealthmap.service.GoogleDriveService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
@Slf4j
public class DocumentController {

    private final AssetDocumentRepository documentRepository;
    private final UserRepository userRepository;
    private final AssetRepository assetRepository;
    private final LiabilityRepository liabilityRepository;
    private final GoogleDriveService googleDriveService;
    private final GeminiService geminiService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final List<String> ALLOWED_MIME_TYPES = List.of(
            "application/pdf",
            "image/jpeg",
            "image/png",
            "image/webp"
    );
    private static final long MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AssetDocumentResponse> uploadDocument(
            Authentication authentication,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "assetId", required = false) Long assetId,
            @RequestParam(value = "liabilityId", required = false) Long liabilityId,
            @RequestParam(value = "documentType", required = false, defaultValue = "OTHER") String documentType
    ) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (file.isEmpty() || file.getSize() > MAX_FILE_SIZE_BYTES) {
            return ResponseEntity.badRequest().build();
        }

        String mimeType = file.getContentType() != null ? file.getContentType() : "application/pdf";
        if (!ALLOWED_MIME_TYPES.contains(mimeType.toLowerCase())) {
            return ResponseEntity.badRequest().build();
        }

        // Verify ownership if assetId or liabilityId is supplied
        Asset asset = null;
        if (assetId != null) {
            asset = assetRepository.findById(assetId)
                    .orElseThrow(() -> new RuntimeException("Asset not found"));
            if (!asset.getUser().getId().equals(user.getId())) {
                return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN).build();
            }
        }

        Liability liability = null;
        if (liabilityId != null) {
            liability = liabilityRepository.findById(liabilityId)
                    .orElseThrow(() -> new RuntimeException("Liability not found"));
            if (!liability.getUser().getId().equals(user.getId())) {
                return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN).build();
            }
        }

        try {
            byte[] fileBytes = file.getBytes();
            String rawFileName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "document.pdf";
            // Sanitize filename to avoid path traversal / header injection
            String fileName = java.nio.file.Paths.get(rawFileName).getFileName().toString();

            // 1. Upload to Google Drive
            Map<String, String> driveRes = googleDriveService.uploadFile(user, fileBytes, fileName, mimeType);
            String driveFileId = driveRes.get("fileId");
            String viewUrl = driveRes.get("viewUrl");
            String downloadUrl = driveRes.get("downloadUrl");

            // 2. AI Document Field Extraction with Gemini Vision
            String extractedJsonStr = "{}";
            Map<String, Object> extractedFields = new HashMap<>();

            if (geminiService.isConfigured()) {
                try {
                    String prompt = "You are a financial document parsing assistant. Extract all financial details from this document (FD certificate, property deed, stock trade confirmation, mutual fund statement, gold invoice, loan agreement, etc.).\n" +
                            "Return a JSON object with any discovered fields among:\n" +
                            "{\n" +
                            "  \"assetType\": \"STOCK | MUTUAL_FUND | GOLD | FIXED_DEPOSIT | REAL_ESTATE | CRYPTOCURRENCY | BOND | ESOP_RSU | LIABILITY\",\n" +
                            "  \"institutionName\": \"Bank/Issuer/Broker name\",\n" +
                            "  \"accountOrFolioNumber\": \"Account/Certificate/Folio Number\",\n" +
                            "  \"holderName\": \"Name of primary holder\",\n" +
                            "  \"principalAmount\": 100000,\n" +
                            "  \"currentValue\": 120000,\n" +
                            "  \"interestRate\": 7.25,\n" +
                            "  \"startDate\": \"YYYY-MM-DD\",\n" +
                            "  \"maturityDate\": \"YYYY-MM-DD\",\n" +
                            "  \"quantityOrUnits\": 100,\n" +
                            "  \"unitPrice\": 1500,\n" +
                            "  \"weightGrams\": 20,\n" +
                            "  \"purity\": \"22K\",\n" +
                            "  \"nomineeName\": \"Nominee name if found\",\n" +
                            "  \"currency\": \"INR | USD | etc.\"\n" +
                            "}";

                    JsonNode extracted = geminiService.generateVisionJson(fileBytes, mimeType, prompt);
                    if (extracted != null) {
                        extractedJsonStr = objectMapper.writeValueAsString(extracted);
                        extracted.fields().forEachRemaining(entry -> {
                            if (!entry.getValue().isNull()) {
                                if (entry.getValue().isNumber()) extractedFields.put(entry.getKey(), entry.getValue().numberValue());
                                else if (entry.getValue().isBoolean()) extractedFields.put(entry.getKey(), entry.getValue().asBoolean());
                                else extractedFields.put(entry.getKey(), entry.getValue().asText());
                            }
                        });
                    }
                } catch (Exception e) {
                    log.warn("Document AI parsing failed: {}", e.getMessage());
                }
            }

            // 3. Save to database
            AssetDocument doc = new AssetDocument();
            doc.setUser(user);
            doc.setFileName(fileName);
            doc.setFileSize(file.getSize());
            doc.setMimeType(mimeType);
            doc.setDriveFileId(driveFileId);
            doc.setDriveViewUrl(viewUrl);
            doc.setDriveDownloadUrl(downloadUrl);
            doc.setDocumentType(documentType);
            doc.setExtractedDataJson(extractedJsonStr);
            doc.setAsset(asset);
            doc.setLiability(liability);

            AssetDocument saved = documentRepository.save(doc);

            return ResponseEntity.ok(mapToResponse(saved, extractedFields));
        } catch (Exception e) {
            log.error("Failed to upload document: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping(value = "/parse-only", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> parseDocumentOnly(
            @RequestParam("file") MultipartFile file
    ) {
        if (file.isEmpty() || file.getSize() > MAX_FILE_SIZE_BYTES) {
            return ResponseEntity.badRequest().build();
        }

        String mimeType = file.getContentType() != null ? file.getContentType() : "application/pdf";
        if (!ALLOWED_MIME_TYPES.contains(mimeType.toLowerCase())) {
            return ResponseEntity.badRequest().build();
        }

        Map<String, Object> extractedFields = new HashMap<>();
        try {
            byte[] fileBytes = file.getBytes();

            if (geminiService.isConfigured()) {
                String prompt = "Extract all financial parameters from this statement, sanction letter, invoice, or receipt to pre-fill an asset or liability/loan entry form.\n" +
                        "Return a strict JSON object with fields: assetType, liabilityType, name, lenderName, bankName, companyName, schemeName, principalAmount, outstandingBalance, purchasePrice, interestRate, monthlyEmi, emi, tenureMonths, units, quantity, averageBuyPrice, weightGrams, purity, startDate, maturityDate, purchaseDate, nomineeName, currency, notes.";

                JsonNode extracted = geminiService.generateVisionJson(fileBytes, mimeType, prompt);
                if (extracted != null) {
                    extracted.fields().forEachRemaining(entry -> {
                        if (!entry.getValue().isNull()) {
                            if (entry.getValue().isNumber()) extractedFields.put(entry.getKey(), entry.getValue().numberValue());
                            else if (entry.getValue().isBoolean()) extractedFields.put(entry.getKey(), entry.getValue().asBoolean());
                            else extractedFields.put(entry.getKey(), entry.getValue().asText());
                        }
                    });
                }
            }
        } catch (Exception e) {
            log.warn("Parse-only failed: {}", e.getMessage());
        }

        return ResponseEntity.ok(extractedFields);
    }

    @GetMapping("/asset/{assetId}")
    public ResponseEntity<List<AssetDocumentResponse>> getDocumentsForAsset(
            Authentication authentication,
            @PathVariable Long assetId
    ) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Asset asset = assetRepository.findById(assetId)
                .orElseThrow(() -> new RuntimeException("Asset not found"));

        // Only owner or members of the same family can view documents
        boolean isOwner = asset.getUser().getId().equals(user.getId());
        boolean isFamilyMember = user.getFamilyGroup() != null && asset.getFamilyGroup() != null &&
                user.getFamilyGroup().getId().equals(asset.getFamilyGroup().getId());

        if (!isOwner && !isFamilyMember) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN).build();
        }

        List<AssetDocument> docs = documentRepository.findByAssetId(assetId);
        List<AssetDocumentResponse> list = docs.stream()
                .map(d -> mapToResponse(d, parseExtractedJson(d.getExtractedDataJson())))
                .collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    @GetMapping("/liability/{liabilityId}")
    public ResponseEntity<List<AssetDocumentResponse>> getDocumentsForLiability(
            Authentication authentication,
            @PathVariable Long liabilityId
    ) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Liability liability = liabilityRepository.findById(liabilityId)
                .orElseThrow(() -> new RuntimeException("Liability not found"));

        boolean isOwner = liability.getUser().getId().equals(user.getId());
        boolean isFamilyMember = user.getFamilyGroup() != null && liability.getFamilyGroup() != null &&
                user.getFamilyGroup().getId().equals(liability.getFamilyGroup().getId());

        if (!isOwner && !isFamilyMember) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN).build();
        }

        List<AssetDocument> docs = documentRepository.findByLiabilityId(liabilityId);
        List<AssetDocumentResponse> list = docs.stream()
                .map(d -> mapToResponse(d, parseExtractedJson(d.getExtractedDataJson())))
                .collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    @GetMapping("/user")
    public ResponseEntity<List<AssetDocumentResponse>> getUserDocuments(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        List<AssetDocument> docs = documentRepository.findByUserId(user.getId());
        List<AssetDocumentResponse> list = docs.stream()
                .map(d -> mapToResponse(d, parseExtractedJson(d.getExtractedDataJson())))
                .collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDocument(Authentication authentication, @PathVariable Long id) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        AssetDocument doc = documentRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new RuntimeException("Document not found"));

        googleDriveService.deleteFile(user, doc.getDriveFileId());
        documentRepository.delete(doc);

        return ResponseEntity.noContent().build();
    }

    private AssetDocumentResponse mapToResponse(AssetDocument doc, Map<String, Object> extractedFields) {
        return AssetDocumentResponse.builder()
                .id(doc.getId())
                .assetId(doc.getAsset() != null ? doc.getAsset().getId() : null)
                .assetName(doc.getAsset() != null ? doc.getAsset().getName() : null)
                .liabilityId(doc.getLiability() != null ? doc.getLiability().getId() : null)
                .liabilityName(doc.getLiability() != null ? doc.getLiability().getName() : null)
                .fileName(doc.getFileName())
                .fileSize(doc.getFileSize())
                .mimeType(doc.getMimeType())
                .driveFileId(doc.getDriveFileId())
                .driveViewUrl(doc.getDriveViewUrl())
                .driveDownloadUrl(doc.getDriveDownloadUrl())
                .documentType(doc.getDocumentType())
                .extractedFields(extractedFields)
                .uploadedAt(doc.getUploadedAt())
                .build();
    }

    private Map<String, Object> parseExtractedJson(String json) {
        if (json == null || json.trim().isEmpty()) return Collections.emptyMap();
        try {
            return objectMapper.readValue(json, Map.class);
        } catch (Exception e) {
            return Collections.emptyMap();
        }
    }
}
