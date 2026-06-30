package com.wealthmap.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

@Service
public class EmailService {

    @Value("${brevo.api.key}")
    private String apiKey;

    @Value("${brevo.sender.email}")
    private String senderEmail;

    public void sendOtpEmail(String toEmail, String otp) {
        try {
            String jsonPayload = """
                {
                    "sender": { "name": "WealthMap", "email": "%s" },
                    "to": [{ "email": "%s" }],
                    "subject": "WealthMap - Password Reset Verification Code",
                    "htmlContent": "<html><body><h2>Password Reset</h2><p>Your verification code is: <strong>%s</strong></p><p>This code will expire in 15 minutes.</p></body></html>"
                }
                """.formatted(senderEmail, toEmail, otp);

            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(10))
                    .build();

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.brevo.com/v3/smtp/email"))
                    .header("accept", "application/json")
                    .header("api-key", apiKey)
                    .header("content-type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 201 && response.statusCode() != 200) {
                System.err.println("Failed to send email via Brevo. Status: " + response.statusCode() + " Body: " + response.body());
                throw new RuntimeException("Failed to send email via Email API.");
            }
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Error sending OTP email: " + e.getMessage());
        }
    }
}
