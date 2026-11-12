package com.wealthmap.service;

import com.wealthmap.entity.PasswordResetToken;
import com.wealthmap.entity.User;
import com.wealthmap.repository.PasswordResetTokenRepository;
import com.wealthmap.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.security.SecureRandom;

@Service
public class PasswordResetService {

    private final SecureRandom secureRandom = new SecureRandom();
    private static final int MAX_ATTEMPTS = 5;

    @Autowired
    private PasswordResetTokenRepository tokenRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;
    
    @Autowired
    private PasswordEncoder passwordEncoder;

    @Transactional
    public void generateAndSendOtp(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("No account found with this email"));

        // Delete any existing tokens for this user to invalidate them
        tokenRepository.deleteByUser(user);

        // Generate cryptographically secure 6-digit OTP
        String otp = String.format("%06d", secureRandom.nextInt(1_000_000));

        PasswordResetToken token = new PasswordResetToken(otp, user);
        tokenRepository.save(token);

        // Send Email
        emailService.sendOtpEmail(user.getEmail(), otp);
    }

    @Transactional
    public void verifyAndResetPassword(String email, String otp, String newPassword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("No account found with this email"));

        PasswordResetToken token = tokenRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("No active password reset request found"));

        if (token.getExpiryDate().isBefore(LocalDateTime.now())) {
            tokenRepository.deleteByUser(user);
            throw new RuntimeException("OTP code has expired. Please request a new one.");
        }

        if (token.getAttemptCount() >= MAX_ATTEMPTS) {
            tokenRepository.deleteByUser(user);
            throw new RuntimeException("Too many failed attempts. This OTP has been invalidated for security. Please request a new one.");
        }

        if (!token.getOtp().equals(otp)) {
            token.setAttemptCount(token.getAttemptCount() + 1);
            tokenRepository.save(token);
            int remaining = MAX_ATTEMPTS - token.getAttemptCount();
            throw new RuntimeException("Invalid OTP code. " + (remaining > 0 ? remaining + " attempt(s) remaining." : "Request a new OTP."));
        }

        // Update password
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Delete token
        tokenRepository.deleteByUser(user);
    }
}
