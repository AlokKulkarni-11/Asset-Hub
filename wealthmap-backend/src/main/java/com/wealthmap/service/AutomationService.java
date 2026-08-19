package com.wealthmap.service;

import com.wealthmap.dto.response.AssetResponse;
import com.wealthmap.dto.response.LiabilityResponse;
import com.wealthmap.entity.NotificationHistory;
import com.wealthmap.entity.NetWorthSnapshot;
import com.wealthmap.entity.User;
import com.wealthmap.repository.NotificationRepository;
import com.wealthmap.repository.NetWorthSnapshotRepository;
import com.wealthmap.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AutomationService {

    private final AlertService alertService;
    private final AnalyticsService analyticsService;
    private final LiabilityService liabilityService;
    private final SnapshotService snapshotService;
    private final NetWorthSnapshotRepository snapshotRepository;
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    @Value("${automation.maturity.reminder-days:7}")
    private int maturityReminderDays;

    @Scheduled(fixedDelayString = "${automation.price-alert.scan-ms:300000}")
    public void runPriceAlertScan() {
        alertService.scanAllPriceAlerts();
    }

    @Scheduled(cron = "${automation.maturity.scan-cron:0 0 8 * * *}")
    public void runMaturityReminderScan() {
        sendMaturityReminders();
    }

    @Scheduled(cron = "${automation.digest.weekly-cron:0 0 9 * * MON}")
    public void runWeeklyDigest() {
        sendDigestForCadence("WEEKLY", 7);
    }

    @Scheduled(cron = "${automation.digest.monthly-cron:0 0 9 1 * *}")
    public void runMonthlyDigest() {
        sendDigestForCadence("MONTHLY", 30);
    }

    @Transactional
    public void sendMaturityReminders() {
        for (User user : userRepository.findAll()) {
            if (user.getEmail() == null) {
                continue;
            }

            List<AssetResponse> assets = analyticsService.getAllAssetsForUser(user.getEmail());
            List<LiabilityResponse> liabilities = liabilityService.getAllLiabilitiesForUser(user.getEmail());

            assets.stream()
                    .filter(asset -> asset.getMaturityDate() != null)
                    .filter(asset -> daysUntil(asset.getMaturityDate()) == maturityReminderDays)
                    .forEach(asset -> sendReminderIfNeeded(
                            user,
                            "FD_MATURITY",
                            asset.getId(),
                            asset.getName(),
                            "Your fixed deposit " + asset.getName() + " matures on " + asset.getMaturityDate() + ".",
                            "MATURITY_REMINDER"));

            liabilities.stream()
                    .filter(liability -> liability.getStartDate() != null && liability.getTenureMonths() != null && liability.getTenureMonths() > 0)
                    .map(liability -> new LiabilityReminder(liability, liability.getStartDate().plusMonths(liability.getTenureMonths())))
                    .filter(reminder -> daysUntil(reminder.maturityDate()) == maturityReminderDays)
                    .forEach(reminder -> sendReminderIfNeeded(
                            user,
                            "LIABILITY_MATURITY",
                            reminder.liability().getId(),
                            reminder.liability().getName(),
                            "Your liability " + reminder.liability().getName() + " is projected to be fully repaid on " + reminder.maturityDate() + ".",
                            "MATURITY_REMINDER"));
        }
    }

    @Transactional
    public void sendDigestForCadence(String cadence, int lookbackDays) {
        for (User user : userRepository.findAll()) {
            if (user.getEmail() == null) {
                continue;
            }
            sendDigestForUser(user, cadence, lookbackDays);
        }
    }

    @Transactional
    public void sendDigestForUser(User user, String cadence, int lookbackDays) {
        List<AssetResponse> assets = analyticsService.getAllAssetsForUser(user.getEmail());
        List<LiabilityResponse> liabilities = liabilityService.getAllLiabilitiesForUser(user.getEmail());

        BigDecimal currentAssets = sumCurrentAssets(assets);
        BigDecimal currentLiabilities = sumOutstandingLiabilities(liabilities);
        BigDecimal currentNetWorth = currentAssets.subtract(currentLiabilities);

        BigDecimal baselineNetWorth = resolveBaselineNetWorth(user.getId(), lookbackDays);
        BigDecimal netWorthChange = currentNetWorth.subtract(baselineNetWorth);

        List<AssetResponse> gainers = assets.stream()
                .sorted(Comparator.comparing(this::gainLossValue).reversed())
                .limit(3)
                .collect(Collectors.toList());

        List<AssetResponse> losers = assets.stream()
                .sorted(Comparator.comparing(this::gainLossValue))
                .limit(3)
                .collect(Collectors.toList());

        List<String> upcomingMaturities = buildUpcomingMaturities(assets, liabilities);
        String subject = cadence.substring(0, 1) + cadence.substring(1).toLowerCase() + " Net Worth Digest";
        String html = buildDigestHtml(user.getName(), cadence, currentNetWorth, netWorthChange, gainers, losers, upcomingMaturities);

        emailService.sendCustomHtmlEmail(user.getEmail(), subject, html);

        NotificationHistory notification = new NotificationHistory();
        notification.setUser(user);
        notification.setTitle(cadence.substring(0, 1) + cadence.substring(1).toLowerCase() + " Digest Ready");
        notification.setMessage("A " + cadence.toLowerCase() + " digest was sent to " + user.getEmail());
        notification.setType(cadence + "_DIGEST");
        notification.setReferenceType(cadence + "_DIGEST");
        notificationRepository.save(notification);
    }

    private void sendReminderIfNeeded(User user, String referenceType, Long referenceId, String title, String message, String notificationType) {
        if (referenceId == null) {
            return;
        }

        if (notificationRepository.existsByUserIdAndReferenceTypeAndReferenceId(user.getId(), referenceType, referenceId)) {
            return;
        }

        NotificationHistory notification = new NotificationHistory();
        notification.setUser(user);
        notification.setTitle(title + " Reminder");
        notification.setMessage(message);
        notification.setType(notificationType);
        notification.setReferenceType(referenceType);
        notification.setReferenceId(referenceId);
        notificationRepository.save(notification);

        emailService.sendMaturityReminderEmail(user.getEmail(), title, message);
    }

    private BigDecimal resolveBaselineNetWorth(Long userId, int lookbackDays) {
        List<NetWorthSnapshot> snapshots = snapshotRepository.findByUserIdOrderBySnapshotDateAsc(userId);
        if (snapshots.isEmpty()) {
            return BigDecimal.ZERO;
        }

        LocalDate cutoffDate = LocalDate.now().minusDays(Math.max(1, lookbackDays));
        NetWorthSnapshot candidate = null;
        for (NetWorthSnapshot snapshot : snapshots) {
            if (!snapshot.getSnapshotDate().isAfter(cutoffDate)) {
                candidate = snapshot;
            }
        }

        if (candidate == null && snapshots.size() > 1) {
            candidate = snapshots.get(snapshots.size() - 2);
        }
        if (candidate == null) {
            candidate = snapshots.get(0);
        }

        return candidate.getTotalNetWorth() != null ? candidate.getTotalNetWorth() : BigDecimal.ZERO;
    }

    private BigDecimal sumCurrentAssets(List<AssetResponse> assets) {
        return assets.stream()
                .map(asset -> asset.getCurrentValue() != null ? asset.getCurrentValue() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal sumOutstandingLiabilities(List<LiabilityResponse> liabilities) {
        return liabilities.stream()
                .map(liability -> liability.getOutstandingBalance() != null ? liability.getOutstandingBalance() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private double gainLossValue(AssetResponse asset) {
        return asset.getGainLoss() != null ? asset.getGainLoss().doubleValue() : 0.0;
    }

    private List<String> buildUpcomingMaturities(List<AssetResponse> assets, List<LiabilityResponse> liabilities) {
        List<String> lines = new ArrayList<>();
        LocalDate today = LocalDate.now();

        assets.stream()
                .filter(asset -> asset.getMaturityDate() != null)
                .sorted(Comparator.comparing(AssetResponse::getMaturityDate))
                .filter(asset -> !asset.getMaturityDate().isBefore(today) && ChronoUnit.DAYS.between(today, asset.getMaturityDate()) <= 30)
                .limit(3)
                .forEach(asset -> lines.add(asset.getName() + " matures in " + ChronoUnit.DAYS.between(today, asset.getMaturityDate()) + " days"));

        liabilities.stream()
                .filter(liability -> liability.getStartDate() != null && liability.getTenureMonths() != null && liability.getTenureMonths() > 0)
                .map(liability -> new LiabilityReminder(liability, liability.getStartDate().plusMonths(liability.getTenureMonths())))
                .filter(reminder -> !reminder.maturityDate().isBefore(today) && ChronoUnit.DAYS.between(today, reminder.maturityDate()) <= 30)
                .sorted(Comparator.comparing(LiabilityReminder::maturityDate))
                .limit(3)
                .forEach(reminder -> lines.add(reminder.liability().getName() + " payoff in " + ChronoUnit.DAYS.between(today, reminder.maturityDate()) + " days"));

        if (lines.isEmpty()) {
            lines.add("No maturities within the next 30 days.");
        }

        return lines;
    }

    private String buildDigestHtml(String userName, String cadence, BigDecimal currentNetWorth, BigDecimal netWorthChange,
                                   List<AssetResponse> gainers, List<AssetResponse> losers, List<String> upcomingMaturities) {
        StringBuilder html = new StringBuilder();
        html.append("<h2>Hello ").append(userName).append(",</h2>");
        html.append("<p>Here is your ").append(cadence.toLowerCase()).append(" Asset Hub digest.</p>");
        html.append("<ul>");
        html.append("<li><b>Current Net Worth:</b> ").append(formatCurrency(currentNetWorth)).append("</li>");
        html.append("<li><b>Change vs baseline:</b> ").append(formatSignedCurrency(netWorthChange)).append("</li>");
        html.append("</ul>");

        html.append("<h3>Top Movers</h3><ul>");
        for (AssetResponse asset : gainers) {
            html.append("<li>").append(asset.getName()).append(": ").append(formatSignedCurrency(asset.getGainLoss() != null ? asset.getGainLoss() : BigDecimal.ZERO)).append("</li>");
        }
        for (AssetResponse asset : losers) {
            html.append("<li>").append(asset.getName()).append(": ").append(formatSignedCurrency(asset.getGainLoss() != null ? asset.getGainLoss() : BigDecimal.ZERO)).append("</li>");
        }
        html.append("</ul>");

        html.append("<h3>Upcoming Maturities</h3><ul>");
        for (String line : upcomingMaturities) {
            html.append("<li>").append(line).append("</li>");
        }
        html.append("</ul>");
        html.append("<p>Open Asset Hub to review your latest portfolio changes and reminders.</p>");
        return html.toString();
    }

    private String formatCurrency(BigDecimal value) {
        return String.format("₹%,.0f", value != null ? value.doubleValue() : 0.0);
    }

    private String formatSignedCurrency(BigDecimal value) {
        double amount = value != null ? value.doubleValue() : 0.0;
        return (amount >= 0 ? "+" : "") + String.format("₹%,.0f", amount);
    }

    private long daysUntil(LocalDate date) {
        return ChronoUnit.DAYS.between(LocalDate.now(), date);
    }

    private record LiabilityReminder(LiabilityResponse liability, LocalDate maturityDate) { }
}
