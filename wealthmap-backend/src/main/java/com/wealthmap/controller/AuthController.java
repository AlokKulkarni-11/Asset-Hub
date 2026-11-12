package com.wealthmap.controller;

import org.springframework.beans.factory.annotation.Autowired;
import com.wealthmap.dto.request.LoginRequest;
import com.wealthmap.dto.request.RegisterRequest;
import com.wealthmap.dto.response.AuthResponse;
import com.wealthmap.entity.User;
import com.wealthmap.repository.UserRepository;
import com.wealthmap.security.JwtUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.Authentication;
import com.wealthmap.service.TfaService;
import lombok.Data;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    private final TfaService tfaService;
    private final com.wealthmap.security.LoginAttemptService loginAttemptService;

    @org.springframework.beans.factory.annotation.Value("${google.client.id:}")
    private String googleClientId;

    @GetMapping("/google/client-id")
    public ResponseEntity<?> getGoogleClientId() {
        java.util.Map<String, String> res = new java.util.HashMap<>();
        res.put("clientId", googleClientId != null ? googleClientId : "");
        return ResponseEntity.ok(res);
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Email is already registered");
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        userRepository.save(user);

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String token = jwtUtil.generateToken(userDetails);

        return ResponseEntity.ok(new AuthResponse(token, user.getId(), user.getEmail(), user.getName(), user.getMobileNumber()));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        String email = request.getEmail().toLowerCase().trim();

        // Check if account is locked due to repeated failed attempts (3 attempts -> 30 min lock)
        if (loginAttemptService.isAccountLocked(email)) {
            long remainingMins = loginAttemptService.getRemainingLockoutMinutes(email);
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(
                    "Account is temporarily locked due to 3 consecutive failed login attempts. Please try again in " + remainingMins + " minute(s)."
            );
        }

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );
        } catch (org.springframework.security.core.AuthenticationException ex) {
            int attempts = loginAttemptService.recordFailedAttempt(email);
            int remaining = com.wealthmap.security.LoginAttemptService.MAX_FAILED_LOGIN_ATTEMPTS - attempts;
            if (remaining > 0) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                        "Invalid email or password. " + remaining + " attempt(s) remaining before a 30-minute account lockout."
                );
            } else {
                return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(
                        "Account locked. 3 consecutive failed attempts detected. Access blocked for 30 minutes."
                );
            }
        }

        // Login succeeded -> Clear failed attempt counter
        loginAttemptService.loginSucceeded(email);

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.isTfaEnabled()) {
            UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
            String tfaToken = jwtUtil.generateTfaPendingToken(userDetails);
            
            AuthResponse response = new AuthResponse();
            response.setTfaRequired(true);
            response.setTfaToken(tfaToken);
            response.setEmail(user.getEmail());
            return ResponseEntity.ok(response);
        }

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String token = jwtUtil.generateToken(userDetails);

        return ResponseEntity.ok(new AuthResponse(token, user.getId(), user.getEmail(), user.getName(), user.getMobileNumber()));
    }

    @Autowired
    private com.wealthmap.service.PasswordResetService passwordResetService;

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody com.wealthmap.dto.request.ForgotPasswordRequest request) {
        try {
            passwordResetService.generateAndSendOtp(request.getEmail());
            return ResponseEntity.ok("OTP sent to your email");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody com.wealthmap.dto.request.ResetPasswordRequest request) {
        try {
            passwordResetService.verifyAndResetPassword(request.getEmail(), request.getOtp(), request.getNewPassword());
            return ResponseEntity.ok("Password reset successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/tfa/setup")
    public ResponseEntity<?> setupTfa(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
        }
        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();
        String secret = tfaService.generateSecret();
        user.setTfaSecret(secret);
        userRepository.save(user);

        String qrCodeUri = tfaService.getQrCodeUri(secret, user.getEmail());
        
        java.util.Map<String, String> response = new java.util.HashMap<>();
        response.put("secret", secret);
        response.put("qrCodeUri", qrCodeUri);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/tfa/enable")
    public ResponseEntity<?> enableTfa(Authentication authentication, @RequestBody TfaVerifyRequest req) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
        }
        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();
        if (user.getTfaSecret() == null) {
            return ResponseEntity.badRequest().body("TFA is not set up yet. Run setup first.");
        }
        
        String cleanCode = req.getCode() != null ? req.getCode().trim().replaceAll("\\s+", "") : "";
        boolean verified = tfaService.verifyCode(user.getTfaSecret(), cleanCode);
        if (!verified) {
            return ResponseEntity.badRequest().body("Invalid verification code.");
        }
        
        user.setTfaEnabled(true);
        java.util.List<String> recoveryCodes = tfaService.generateRecoveryCodes();
        user.setTfaRecoveryCodes(recoveryCodes);
        userRepository.save(user);
        
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        response.put("success", true);
        response.put("recoveryCodes", recoveryCodes);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/tfa/disable")
    public ResponseEntity<?> disableTfa(Authentication authentication, @RequestBody TfaVerifyRequest req) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
        }
        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();
        
        String cleanCode = req.getCode() != null ? req.getCode().trim().replaceAll("\\s+", "") : "";
        boolean verified = tfaService.verifyCode(user.getTfaSecret(), cleanCode);
        if (!verified) {
            return ResponseEntity.badRequest().body("Invalid verification code.");
        }
        
        user.setTfaEnabled(false);
        user.setTfaSecret(null);
        user.getTfaRecoveryCodes().clear();
        userRepository.save(user);
        
        return ResponseEntity.ok("Two-factor authentication has been disabled.");
    }

    @PostMapping("/verify-totp")
    public ResponseEntity<?> verifyTotp(@RequestBody VerifyTotpRequest req) {
        String token = req.getTfaToken();
        if (token == null || !jwtUtil.is2faPending(token)) {
            return ResponseEntity.badRequest().body("Invalid or expired 2FA transaction token.");
        }
        
        String email = jwtUtil.extractUsername(token);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String cleanCode = req.getCode() != null ? req.getCode().trim().replaceAll("\\s+", "") : "";
        boolean verified = false;
        if (user.getTfaRecoveryCodes() != null && user.getTfaRecoveryCodes().contains(cleanCode.toUpperCase())) {
            user.getTfaRecoveryCodes().remove(cleanCode.toUpperCase());
            userRepository.save(user);
            verified = true;
        } else {
            verified = tfaService.verifyCode(user.getTfaSecret(), cleanCode);
        }
        
        if (!verified) {
            return ResponseEntity.badRequest().body("Invalid verification code.");
        }
        
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String finalToken = jwtUtil.generateToken(userDetails);
        
        return ResponseEntity.ok(new AuthResponse(finalToken, user.getId(), user.getEmail(), user.getName(), user.getMobileNumber()));
    }

    @Autowired
    private com.wealthmap.service.GoogleDriveService googleDriveService;

    @PostMapping("/google")
    public ResponseEntity<?> googleAuth(@RequestBody com.wealthmap.dto.request.GoogleOAuthRequest req) {
        if (req.getCode() == null || req.getCode().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Authorization code is required");
        }

        java.util.Map<String, Object> tokenInfo = googleDriveService.exchangeAuthCode(req.getCode(), req.getRedirectUri());
        String email = (String) tokenInfo.get("email");
        if (email == null) {
            return ResponseEntity.badRequest().body("Failed to retrieve profile from Google");
        }

        String name = (String) tokenInfo.get("name");
        String accessToken = (String) tokenInfo.get("accessToken");
        String refreshToken = (String) tokenInfo.get("refreshToken");
        int expiresIn = tokenInfo.get("expiresIn") != null ? (Integer) tokenInfo.get("expiresIn") : 3600;

        User user = userRepository.findByEmail(email).orElseGet(() -> {
            User newUser = new User();
            newUser.setEmail(email);
            newUser.setName(name != null && !name.trim().isEmpty() ? name : email.split("@")[0]);
            newUser.setPassword(passwordEncoder.encode(java.util.UUID.randomUUID().toString()));
            return newUser;
        });

        user.setGoogleEmail(email);
        user.setGoogleAccessToken(accessToken);
        if (refreshToken != null) {
            user.setGoogleRefreshToken(refreshToken);
        }
        user.setGoogleTokenExpiresAt(java.time.LocalDateTime.now().plusSeconds(expiresIn));
        userRepository.save(user);

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String token = jwtUtil.generateToken(userDetails);

        return ResponseEntity.ok(new AuthResponse(token, user.getId(), user.getEmail(), user.getName(), user.getMobileNumber()));
    }

    @PostMapping("/google/link")
    public ResponseEntity<?> linkGoogleDrive(Authentication authentication, @RequestBody com.wealthmap.dto.request.GoogleOAuthRequest req) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
        }

        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();
        if (req.getCode() == null || req.getCode().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Authorization code is required");
        }

        java.util.Map<String, Object> tokenInfo = googleDriveService.exchangeAuthCode(req.getCode(), req.getRedirectUri());
        String email = (String) tokenInfo.get("email");
        String accessToken = (String) tokenInfo.get("accessToken");
        String refreshToken = (String) tokenInfo.get("refreshToken");
        int expiresIn = tokenInfo.get("expiresIn") != null ? (Integer) tokenInfo.get("expiresIn") : 3600;

        if (accessToken == null) {
            return ResponseEntity.badRequest().body("Failed to obtain Google tokens");
        }

        user.setGoogleEmail(email != null ? email : user.getEmail());
        user.setGoogleAccessToken(accessToken);
        if (refreshToken != null) {
            user.setGoogleRefreshToken(refreshToken);
        }
        user.setGoogleTokenExpiresAt(java.time.LocalDateTime.now().plusSeconds(expiresIn));
        userRepository.save(user);

        java.util.Map<String, Object> res = new java.util.HashMap<>();
        res.put("success", true);
        res.put("googleEmail", user.getGoogleEmail());
        return ResponseEntity.ok(res);
    }

    @GetMapping("/google/status")
    public ResponseEntity<?> getGoogleStatus(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
        }
        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();
        java.util.Map<String, Object> res = new java.util.HashMap<>();
        res.put("isLinked", user.isGoogleDriveConnected());
        res.put("googleEmail", user.getGoogleEmail());
        return ResponseEntity.ok(res);
    }
}

@Data
class TfaVerifyRequest {
    private String code;
}

@Data
class VerifyTotpRequest {
    private String code;
    private String tfaToken;
}
