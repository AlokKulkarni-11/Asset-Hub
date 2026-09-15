package com.wealthmap.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssetDocumentResponse {
    private Long id;
    private Long assetId;
    private String assetName;
    private Long liabilityId;
    private String liabilityName;
    private String fileName;
    private Long fileSize;
    private String mimeType;
    private String driveFileId;
    private String driveViewUrl;
    private String driveDownloadUrl;
    private String documentType;
    private Map<String, Object> extractedFields;
    private LocalDateTime uploadedAt;
}
