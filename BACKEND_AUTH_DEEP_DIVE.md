# Backend Auth & Security Deep Dive

This document covers the complete authentication, authorization, two-factor authentication (TOTP 2FA), Google OAuth, and password-reset architecture of AssetHub’s backend.

---

## 1. Architecture Overview

AssetHub uses a stateless, multi-layered security architecture powered by **Spring Boot 3.2**, **Spring Security**, **Stateless HMAC-SHA256 JWTs**, **TOTP RFC 6238 Two-Factor Authentication**, **Google OAuth 2.0**, and **Brevo HTTP API** for transactional OTP delivery.

### Key Components:
- `com.wealthmap.controller.AuthController`: Exposes public and secured authentication endpoints (`/api/auth/**`).
- `com.wealthmap.config.SecurityConfig`: Configures stateless session management, CORS policies, password hashing (BCrypt), and request authorization filters.
- `com.wealthmap.security.JwtUtil`: Generates, parses, and validates signed JWT tokens (including standard session tokens and temporary 2FA-pending tokens).
- `com.wealthmap.security.JwtAuthFilter`: Intercepts inbound HTTP requests, extracts the Bearer token, validates the signature and expiration, and establishes the `SecurityContextHolder`.
- `com.wealthmap.security.UserDetailsServiceImpl`: Bridges the persistent `User` entity to Spring Security's `UserDetails`.
- `com.wealthmap.service.TfaService`: Handles TOTP secret generation, QR code URI generation, time-step code verification, and backup recovery code hashing/validation.
- `com.wealthmap.service.GoogleDriveService`: Handles OAuth2 authorization code exchange with Google's token servers for Google Sign-In and Google Drive vault access.
- `com.wealthmap.service.PasswordResetService`: Manages 6-digit numeric OTP generation, expiry tracking (15 minutes), and Brevo email delivery.

---

## 2. Feature-by-Feature Breakdown

### 2.1 Standard Registration & Login
- **Registration (`POST /api/auth/register`)**: Validates input (`@Valid`), prevents duplicate emails (`userRepository.existsByEmail`), hashes passwords with BCrypt (10 rounds), persists the user, and generates an immediate session JWT.
- **Login (`POST /api/auth/login`)**: Authenticates credentials via `AuthenticationManager`. If the user has 2FA enabled, it emits a short-lived `tfaPendingToken` and flags `tfaRequired: true`. If 2FA is not enabled, it issues the full session JWT.

### 2.2 Two-Factor Authentication (TOTP 2FA)
- **Setup (`POST /api/auth/tfa/setup`)**: Authenticated user requests a new base32 secret. The server generates the secret via `dev.samstevens.totp` and formats an `otpauth://` URI for QR code generation in Google Authenticator or Microsoft Authenticator.
- **Enable (`POST /api/auth/tfa/enable`)**: Validates the user's submitted 6-digit TOTP code against the generated secret. Upon success, generates 8 single-use recovery backup codes, persists them, and sets `tfaEnabled = true`.
- **Verification (`POST /api/auth/verify-totp`)**: Used during login. Accepts the temporary `tfaToken` and the 6-digit code (or an 8-character recovery code). Validates the code, consumes recovery codes if used, and returns the full session JWT.
- **Disable (`POST /api/auth/tfa/disable`)**: Requires active code verification before clearing the secret and recovery codes.

### 2.3 Google OAuth 2.0 Integration
- **Client ID Discovery (`GET /api/auth/google/client-id`)**: Public endpoint allowing the frontend to dynamically fetch the configured `google.client.id` without hardcoding it in the frontend bundle.
- **Google Sign-In (`POST /api/auth/google`)**: Exchanges Google OAuth `authCode` for access and refresh tokens. Finds or creates the user in the database, stores Google access tokens for Document Vault usage, and issues an AssetHub session JWT.
- **Google Drive Link (`POST /api/auth/google/link`)**: Links an existing authenticated account to Google Drive for secure document storage.
- **Google Status (`GET /api/auth/google/status`)**: Reports whether Google Drive is connected and displays the connected Google email.

### 2.4 Password Recovery via Brevo Email OTP
- **Forgot Password (`POST /api/auth/forgot-password`)**: Generates a secure random 6-digit OTP, stores it in `password_reset_tokens` with a 15-minute expiration timestamp, and sends a styled HTML email via Brevo HTTP API.
- **Reset Password (`POST /api/auth/reset-password`)**: Verifies the OTP, ensures it is not expired, hashes the new password with BCrypt, updates the user, and deletes the consumed token.

---

## 3. Deep Dive into Complex Flows

```
[Client] ---> POST /api/auth/login ---> [AuthController]
                                                |
                                    [AuthenticationManager]
                                                |
                                   Is TFA Enabled for User?
                                   /                      \
                             [YES]                         [NO]
                               /                             \
                Generate TFA Pending JWT              Generate Full Session JWT
                               |                              |
                   Return AuthResponse                       Return AuthResponse
                   { tfaRequired: true,                      { token: "jwt...",
                     tfaToken: "..." }                         user: {...} }
                               |
                   [Client shows 2FA Modal]
                               |
               POST /api/auth/verify-totp
                { tfaToken, code/recovery }
                               |
                  [Validate TOTP/Recovery]
                               |
                   Generate Full Session JWT
```

---

## 4. Critical Edge Cases & Failure Modes

1. **Clock Drift in TOTP**: `TfaService` implements a time disparity window allowing codes from adjacent 30-second time steps ($T-1$ and $T+1$) to prevent false rejections caused by slight client-server clock desynchronization.
2. **Recovery Code Single-Use**: When an 8-character alphanumeric recovery code is used, it is atomically removed from the user's `tfaRecoveryCodes` list upon successful authentication.
3. **2FA Pending Token Security**: `tfaPendingToken` contains a dedicated claim `is2faPending: true`. `JwtAuthFilter` explicitly ignores 2FA-pending tokens for protected API routes, ensuring they cannot be used to bypass authorization.
4. **Google Token Refresh**: `GoogleDriveService` automatically inspects `googleTokenExpiresAt` and utilizes the stored `googleRefreshToken` when uploading documents to the vault.
