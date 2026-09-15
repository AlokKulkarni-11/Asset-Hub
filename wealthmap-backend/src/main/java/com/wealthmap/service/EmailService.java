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

    @Value("${brevo.api.key:}")
    private String apiKey;

    @Value("${brevo.sender.email:alokgdsc@gmail.com}")
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

    public void sendFamilyInviteEmail(String toEmail, String inviteeName, String inviterName, String inviterEmail, String familyName, String acceptLink) {
        try {
            String htmlContent = "<h2>Hello " + inviteeName + ",</h2>" +
                    "<p><b>" + inviterName + "</b> (" + inviterEmail + ") has invited you to join their family group <b>" + familyName + "</b> on Asset Hub.</p>" +
                    "<p>By joining, you will be able to pool your asset tracking and monitor your family's combined net worth!</p>" +
                    "<br/>" +
                    "<a href=\"" + acceptLink + "\" style=\"background-color:#D4A843; color:black; padding:10px 20px; text-decoration:none; border-radius:5px; font-weight:bold;\">Accept Invitation</a>" +
                    "<br/><br/><p>If the button doesn't work, copy and paste this link into your browser:</p>" +
                    "<p>" + acceptLink + "</p>";

            // Escape quotes for JSON payload
            String escapedHtml = htmlContent.replace("\"", "\\\"");

            String jsonPayload = """
                {
                    "sender": { "name": "Asset Hub Invitations", "email": "%s" },
                    "to": [{ "email": "%s" }],
                    "replyTo": { "email": "%s" },
                    "subject": "You've been invited to join %s on Asset Hub!",
                    "htmlContent": "%s"
                }
                """.formatted(senderEmail, toEmail, inviterEmail, familyName, escapedHtml);

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
                System.err.println("Failed to send family invite via Brevo. Status: " + response.statusCode() + " Body: " + response.body());
                throw new RuntimeException("Failed to send family invite email.");
            }
        } catch (Exception e) {
            e.printStackTrace();
            System.err.println("Error sending family invite email: " + e.getMessage());
        }
    }

    public void sendPriceAlertEmail(String toEmail, String assetName, double targetPrice, double currentPrice, String condition) {
        try {
            String subject = "Asset Hub Alert: " + assetName + " has crossed target price!";
            String htmlContent = "<h2>Asset Hub Price Alert</h2>" +
                    "<p>Your asset <b>" + assetName + "</b> has triggered your target price alert.</p>" +
                    "<ul>" +
                    "<li><b>Condition:</b> " + condition + " ₹" + String.format("%.2f", targetPrice) + "</li>" +
                    "<li><b>Current Live Price:</b> ₹" + String.format("%.2f", currentPrice) + "</li>" +
                    "</ul>" +
                    "<p>Log in to your Asset Hub dashboard to review your portfolio allocation.</p>";

            sendGenericBrevoEmail(toEmail, subject, htmlContent);
        } catch (Exception e) {
            System.err.println("Failed to send price alert email: " + e.getMessage());
        }
    }

    public void sendMaturityReminderEmail(String toEmail, String title, String message) {
        try {
            String subject = "Asset Hub Reminder: " + title;
            String htmlContent = "<h2>Upcoming Maturity / Payoff Reminder</h2>" +
                    "<p>" + message + "</p>" +
                    "<p>Log in to Asset Hub to review upcoming maturities.</p>";

            sendGenericBrevoEmail(toEmail, subject, htmlContent);
        } catch (Exception e) {
            System.err.println("Failed to send maturity reminder email: " + e.getMessage());
        }
    }

    public void sendNetWorthDigestEmail(String toEmail, String userName, double netWorth, double liquidAssets, int assetCount) {
        try {
            String subject = "Your Asset Hub Weekly Net Worth Digest";
            String htmlContent = "<h2>Hello " + userName + ",</h2>" +
                    "<p>Here is your current portfolio digest summary from <b>Asset Hub</b>:</p>" +
                    "<ul>" +
                    "<li><b>Total Net Worth:</b> ₹" + String.format("%,.0f", netWorth) + "</li>" +
                    "<li><b>Liquid Capital:</b> ₹" + String.format("%,.0f", liquidAssets) + "</li>" +
                    "<li><b>Total Tracked Assets:</b> " + assetCount + "</li>" +
                    "</ul>" +
                    "<p>Keep up the great work building your financial independence!</p>";

            sendGenericBrevoEmail(toEmail, subject, htmlContent);
        } catch (Exception e) {
            System.err.println("Failed to send digest email: " + e.getMessage());
        }
    }

    public void sendCustomHtmlEmail(String toEmail, String subject, String htmlContent) {
        try {
            sendGenericBrevoEmail(toEmail, subject, htmlContent);
        } catch (Exception e) {
            System.err.println("Failed to send custom email: " + e.getMessage());
        }
    }

    private void sendGenericBrevoEmail(String toEmail, String subject, String htmlContent) throws Exception {
        if (apiKey == null || apiKey.isEmpty() || senderEmail == null || senderEmail.isEmpty()) {
            System.out.println("[BREVO MOCK EMAIL] To: " + toEmail + " | Subject: " + subject);
            return;
        }

        String escapedHtml = htmlContent.replace("\"", "\\\"");
        String jsonPayload = """
            {
                "sender": { "name": "Asset Hub Alerts", "email": "%s" },
                "to": [{ "email": "%s" }],
                "subject": "%s",
                "htmlContent": "%s"
            }
            """.formatted(senderEmail, toEmail, subject, escapedHtml);

        HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.brevo.com/v3/smtp/email"))
                .header("accept", "application/json")
                .header("api-key", apiKey)
                .header("content-type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                .build();

        client.send(request, HttpResponse.BodyHandlers.ofString());
    }
}
