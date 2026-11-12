package com.wealthmap.service;

import dev.samstevens.totp.code.*;
import dev.samstevens.totp.qr.QrData;
import dev.samstevens.totp.secret.DefaultSecretGenerator;
import dev.samstevens.totp.secret.SecretGenerator;
import dev.samstevens.totp.time.SystemTimeProvider;
import dev.samstevens.totp.time.TimeProvider;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class TfaService {

    private final SecretGenerator secretGenerator = new DefaultSecretGenerator();
    private final TimeProvider timeProvider = new SystemTimeProvider();
    private final CodeGenerator codeGenerator = new DefaultCodeGenerator();
    private final CodeVerifier verifier;

    public TfaService() {
        DefaultCodeVerifier defaultVerifier = new DefaultCodeVerifier(codeGenerator, timeProvider);
        defaultVerifier.setTimePeriod(30);
        // Allow ±60 seconds clock drift discrepancy (RFC 6238 standard) to account for client-server time sync variance
        defaultVerifier.setAllowedTimePeriodDiscrepancy(2);
        this.verifier = defaultVerifier;
    }

    public String generateSecret() {
        return secretGenerator.generate();
    }

    public String getQrCodeUri(String secret, String email) {
        QrData data = new QrData.Builder()
                .label(email)
                .secret(secret)
                .issuer("Asset Hub")
                .algorithm(HashingAlgorithm.SHA1)
                .digits(6)
                .period(30)
                .build();
        return data.getUri();
    }

    public boolean verifyCode(String secret, String code) {
        if (secret == null || code == null) return false;
        String cleanCode = code.replaceAll("\\s+", "").trim();
        return verifier.isValidCode(secret, cleanCode);
    }

    public List<String> generateRecoveryCodes() {
        List<String> codes = new ArrayList<>();
        for (int i = 0; i < 5; i++) {
            codes.add(UUID.randomUUID().toString().substring(0, 10).toUpperCase());
        }
        return codes;
    }
}
