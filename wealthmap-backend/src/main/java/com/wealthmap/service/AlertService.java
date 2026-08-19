package com.wealthmap.service;

import com.wealthmap.dto.request.PriceAlertRequest;
import com.wealthmap.dto.response.AssetResponse;
import com.wealthmap.dto.response.NotificationResponse;
import com.wealthmap.dto.response.PriceAlertResponse;
import com.wealthmap.entity.NotificationHistory;
import com.wealthmap.entity.PriceAlert;
import com.wealthmap.entity.User;
import com.wealthmap.repository.NotificationRepository;
import com.wealthmap.repository.PriceAlertRepository;
import com.wealthmap.repository.UserRepository;
import com.wealthmap.util.LiquidityHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AlertService {

    private final PriceAlertRepository alertRepository;
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final AnalyticsService analyticsService;
    private final EmailService emailService;

    // --- Price Alerts CRUD & Scan ---

    @Transactional
    public PriceAlertResponse createPriceAlert(PriceAlertRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        PriceAlert alert = new PriceAlert();
        alert.setUser(user);
        alert.setAssetId(request.getAssetId());
        alert.setAssetName(request.getAssetName());
        alert.setAssetType(request.getAssetType());
        alert.setTargetPrice(request.getTargetPrice());
        alert.setAlertCondition(request.getAlertCondition() != null ? request.getAlertCondition().toUpperCase() : "ABOVE");
        alert.setActive(true);

        PriceAlert saved = alertRepository.save(alert);
        return mapToAlertResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<PriceAlertResponse> getUserAlerts(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return alertRepository.findByUserId(user.getId())
                .stream()
                .map(this::mapToAlertResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteAlert(Long id, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        PriceAlert alert = alertRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Alert not found"));

        if (!alert.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Access Denied");
        }

        alertRepository.delete(alert);
    }

    @Transactional
    public int scanAllPriceAlerts() {
        int triggeredCount = 0;
        for (PriceAlert alert : alertRepository.findByActiveTrue()) {
            User user = alert.getUser();
            if (user == null || user.getEmail() == null) {
                continue;
            }

            List<AssetResponse> assets = analyticsService.getAllAssetsForUser(user.getEmail());
            if (evaluatePriceAlert(alert, assets, user)) {
                triggeredCount++;
            }
        }
        return triggeredCount;
    }

    @Transactional
    public void checkAndTriggerPriceAlerts(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<PriceAlert> userAlerts = alertRepository.findByUserId(user.getId());
        List<AssetResponse> userAssets = analyticsService.getAllAssetsForUser(userEmail);

        for (PriceAlert alert : userAlerts) {
            evaluatePriceAlert(alert, userAssets, user);
        }
    }

    // --- Notifications Dropdown & Digest ---

    @Transactional(readOnly = true)
    public List<NotificationResponse> getUserNotifications(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(this::mapToNotifResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void markNotificationRead(Long id, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        NotificationHistory notif = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification not found"));

        if (notif.getUser().getId().equals(user.getId())) {
            notif.setRead(true);
            notificationRepository.save(notif);
        }
    }

    @Transactional
    public void sendManualDigestEmail(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<AssetResponse> assets = analyticsService.getAllAssetsForUser(userEmail);
        double totalAssets = assets.stream().mapToDouble(a -> a.getCurrentValue() != null ? a.getCurrentValue().doubleValue() : 0).sum();
        double liquidTotal = LiquidityHelper.calculateLiquidTotal(assets);

        emailService.sendNetWorthDigestEmail(user.getEmail(), user.getName(), totalAssets, liquidTotal, assets.size());

        NotificationHistory notif = new NotificationHistory();
        notif.setUser(user);
        notif.setTitle("Weekly Net Worth Digest Sent");
        notif.setMessage("Sent a portfolio digest summary to " + user.getEmail());
        notif.setType("DIGEST");
        notificationRepository.save(notif);
    }

    private boolean evaluatePriceAlert(PriceAlert alert, List<AssetResponse> userAssets, User user) {
        if (!alert.isActive()) {
            return false;
        }

        Optional<AssetResponse> matchedAsset = userAssets.stream()
                .filter(a -> (alert.getAssetId() != null && alert.getAssetId().equals(a.getId()))
                        || (a.getName() != null && alert.getAssetName() != null && a.getName().equalsIgnoreCase(alert.getAssetName())))
                .findFirst();

        if (matchedAsset.isEmpty() || matchedAsset.get().getCurrentValue() == null) {
            return false;
        }

        BigDecimal currentPrice = matchedAsset.get().getCurrentValue();
        BigDecimal targetPrice = alert.getTargetPrice();
        BigDecimal previousObserved = alert.getLastObservedPrice();
        alert.setLastObservedPrice(currentPrice);

        if (previousObserved == null) {
            alertRepository.save(alert);
            return false;
        }

        boolean triggered = false;
        if ("ABOVE".equalsIgnoreCase(alert.getAlertCondition())) {
            triggered = previousObserved.compareTo(targetPrice) < 0 && currentPrice.compareTo(targetPrice) >= 0;
        } else if ("BELOW".equalsIgnoreCase(alert.getAlertCondition())) {
            triggered = previousObserved.compareTo(targetPrice) > 0 && currentPrice.compareTo(targetPrice) <= 0;
        }

        if (!triggered) {
            alertRepository.save(alert);
            return false;
        }

        alert.setLastTriggeredAt(LocalDateTime.now());
        alertRepository.save(alert);

        NotificationHistory notif = new NotificationHistory();
        notif.setUser(user);
        notif.setTitle("Price Alert Triggered: " + alert.getAssetName());
        notif.setMessage("Your asset " + alert.getAssetName() + " crossed " + alert.getAlertCondition() + " "
                + String.format("₹%,.2f", targetPrice) + " and is now at " + String.format("₹%,.2f", currentPrice));
        notif.setType("PRICE_ALERT");
        notif.setReferenceType("PRICE_ALERT");
        notif.setReferenceId(alert.getId());
        notificationRepository.save(notif);

        emailService.sendPriceAlertEmail(user.getEmail(), alert.getAssetName(), targetPrice.doubleValue(), currentPrice.doubleValue(), alert.getAlertCondition());
        return true;
    }

    private PriceAlertResponse mapToAlertResponse(PriceAlert alert) {
        PriceAlertResponse resp = new PriceAlertResponse();
        resp.setId(alert.getId());
        resp.setAssetId(alert.getAssetId());
        resp.setAssetName(alert.getAssetName());
        resp.setAssetType(alert.getAssetType());
        resp.setTargetPrice(alert.getTargetPrice());
        resp.setAlertCondition(alert.getAlertCondition());
        resp.setActive(alert.isActive());
        resp.setLastObservedPrice(alert.getLastObservedPrice());
        resp.setLastTriggeredAt(alert.getLastTriggeredAt());
        resp.setCreatedAt(alert.getCreatedAt());
        return resp;
    }

    private NotificationResponse mapToNotifResponse(NotificationHistory notif) {
        NotificationResponse resp = new NotificationResponse();
        resp.setId(notif.getId());
        resp.setTitle(notif.getTitle());
        resp.setMessage(notif.getMessage());
        resp.setType(notif.getType());
        resp.setRead(notif.isRead());
        resp.setCreatedAt(notif.getCreatedAt());
        return resp;
    }
}
