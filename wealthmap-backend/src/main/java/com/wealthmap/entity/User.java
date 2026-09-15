package com.wealthmap.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String name;

    @Column(name = "mobile_number")
    private String mobileNumber;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "family_group_id")
    private FamilyGroup familyGroup;

    @Enumerated(EnumType.STRING)
    @Column(name = "family_role")
    private com.wealthmap.enums.FamilyRole familyRole;

    @Column(name = "tfa_enabled")
    private Boolean tfaEnabled = false;

    public boolean isTfaEnabled() {
        return tfaEnabled != null && tfaEnabled;
    }

    @Column(name = "tfa_secret")
    private String tfaSecret;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_tfa_recovery_codes", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "recovery_code")
    private java.util.List<String> tfaRecoveryCodes = new java.util.ArrayList<>();

    // Google OAuth & Google Drive Integration
    @Column(name = "google_id")
    private String googleId;

    @Column(name = "google_email")
    private String googleEmail;

    @Column(name = "google_access_token", columnDefinition = "TEXT")
    private String googleAccessToken;

    @Column(name = "google_refresh_token", columnDefinition = "TEXT")
    private String googleRefreshToken;

    @Column(name = "google_token_expires_at")
    private LocalDateTime googleTokenExpiresAt;

    @Column(name = "google_drive_folder_id")
    private String googleDriveFolderId;

    public boolean isGoogleDriveConnected() {
        return googleRefreshToken != null || (googleAccessToken != null && googleTokenExpiresAt != null && googleTokenExpiresAt.isAfter(LocalDateTime.now()));
    }
}
