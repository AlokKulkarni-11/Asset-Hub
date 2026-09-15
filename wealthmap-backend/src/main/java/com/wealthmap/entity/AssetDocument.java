package com.wealthmap.entity;

import com.wealthmap.entity.base.Asset;
import com.wealthmap.entity.base.Liability;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "asset_documents")
@Data
@NoArgsConstructor
public class AssetDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "asset_id")
    private Asset asset;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "liability_id")
    private Liability liability;

    @Column(nullable = false)
    private String fileName;

    private Long fileSize;

    private String mimeType;

    @Column(name = "drive_file_id", nullable = false)
    private String driveFileId;

    @Column(name = "drive_view_url", columnDefinition = "TEXT")
    private String driveViewUrl;

    @Column(name = "drive_download_url", columnDefinition = "TEXT")
    private String driveDownloadUrl;

    @Column(name = "document_type")
    private String documentType;

    @Column(name = "extracted_data_json", columnDefinition = "TEXT")
    private String extractedDataJson;

    @CreationTimestamp
    @Column(name = "uploaded_at")
    private LocalDateTime uploadedAt;
}
