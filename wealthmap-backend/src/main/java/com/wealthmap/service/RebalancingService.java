package com.wealthmap.service;

import com.wealthmap.dto.request.RebalancingRequest;
import com.wealthmap.dto.response.AssetResponse;
import com.wealthmap.dto.response.RebalancingResponse;
import com.wealthmap.entity.RebalancingTarget;
import com.wealthmap.entity.User;
import com.wealthmap.enums.AssetType;
import com.wealthmap.repository.RebalancingTargetRepository;
import com.wealthmap.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RebalancingService {

    private final RebalancingTargetRepository targetRepository;
    private final UserRepository userRepository;
    private final AnalyticsService analyticsService;
    private final LiabilityService liabilityService;

    @Transactional
    public RebalancingResponse saveTarget(RebalancingRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        RebalancingTarget target = targetRepository.findByUserId(user.getId()).orElseGet(() -> {
            RebalancingTarget created = new RebalancingTarget();
            created.setUser(user);
            return created;
        });

        target.setTargetEquityPct(request.getTargetEquityPct());
        target.setTargetDebtPct(request.getTargetDebtPct());
        target.setTargetGoldPct(request.getTargetGoldPct());
        target.setDriftThresholdPct(request.getDriftThresholdPct() > 0 ? request.getDriftThresholdPct() : 5.0);

        targetRepository.save(target);
        return getStatus(userEmail);
    }

    @Transactional(readOnly = true)
    public RebalancingResponse getStatus(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        RebalancingTarget target = targetRepository.findByUserId(user.getId()).orElseGet(() -> {
            RebalancingTarget created = new RebalancingTarget();
            created.setUser(user);
            created.setTargetEquityPct(60.0);
            created.setTargetDebtPct(30.0);
            created.setTargetGoldPct(10.0);
            created.setDriftThresholdPct(5.0);
            return created;
        });

        List<AssetResponse> assets = analyticsService.getAllAssetsForUser(userEmail);
        double liabilities = liabilityService.getAllLiabilitiesForUser(userEmail)
                .stream()
                .mapToDouble(item -> item.getOutstandingBalance() != null ? item.getOutstandingBalance().doubleValue() : 0.0)
                .sum();

        double goldValue = assets.stream()
                .filter(asset -> asset.getAssetType() == AssetType.GOLD || asset.getAssetType() == AssetType.SILVER || asset.getAssetType() == AssetType.SOVEREIGN_GOLD_BOND)
                .mapToDouble(this::currentValue)
                .sum();

        double debtAssetsValue = assets.stream()
                .filter(asset -> asset.getAssetType() == AssetType.FIXED_DEPOSIT || asset.getAssetType() == AssetType.BOND || asset.getAssetType() == AssetType.PPF)
                .mapToDouble(this::currentValue)
                .sum();

        double totalDebt = debtAssetsValue + liabilities;

        double equityValue = assets.stream()
                .filter(asset -> asset.getAssetType() == AssetType.STOCK || asset.getAssetType() == AssetType.MUTUAL_FUND || asset.getAssetType() == AssetType.ESOP_RSU || asset.getAssetType() == AssetType.CRYPTOCURRENCY || asset.getAssetType() == AssetType.REAL_ESTATE)
                .mapToDouble(this::currentValue)
                .sum();

        double portfolioBase = equityValue + goldValue + totalDebt;
        double currentEquityPct = portfolioBase > 0 ? (equityValue / portfolioBase) * 100.0 : 0.0;
        double currentDebtPct = portfolioBase > 0 ? (totalDebt / portfolioBase) * 100.0 : 0.0;
        double currentGoldPct = portfolioBase > 0 ? (goldValue / portfolioBase) * 100.0 : 0.0;

        double equityDrift = currentEquityPct - target.getTargetEquityPct();
        double debtDrift = currentDebtPct - target.getTargetDebtPct();
        double goldDrift = currentGoldPct - target.getTargetGoldPct();

        boolean needsRebalancing = Math.abs(equityDrift) > target.getDriftThresholdPct()
                || Math.abs(debtDrift) > target.getDriftThresholdPct()
                || Math.abs(goldDrift) > target.getDriftThresholdPct();

        RebalancingResponse response = new RebalancingResponse();
        response.setTargetEquityPct(target.getTargetEquityPct());
        response.setTargetDebtPct(target.getTargetDebtPct());
        response.setTargetGoldPct(target.getTargetGoldPct());
        response.setCurrentEquityPct(currentEquityPct);
        response.setCurrentDebtPct(currentDebtPct);
        response.setCurrentGoldPct(currentGoldPct);
        response.setEquityDriftPct(equityDrift);
        response.setDebtDriftPct(debtDrift);
        response.setGoldDriftPct(goldDrift);
        response.setDriftThresholdPct(target.getDriftThresholdPct());
        response.setNeedsRebalancing(needsRebalancing);
        response.setNudgeMessage(buildNudgeMessage(equityDrift, debtDrift, goldDrift, target.getDriftThresholdPct()));
        response.setRecommendedEquityAdjustment(BigDecimal.valueOf(((target.getTargetEquityPct() - currentEquityPct) / 100.0) * portfolioBase).setScale(2, RoundingMode.HALF_UP));
        response.setRecommendedDebtAdjustment(BigDecimal.valueOf(((target.getTargetDebtPct() - currentDebtPct) / 100.0) * portfolioBase).setScale(2, RoundingMode.HALF_UP));
        response.setRecommendedGoldAdjustment(BigDecimal.valueOf(((target.getTargetGoldPct() - currentGoldPct) / 100.0) * portfolioBase).setScale(2, RoundingMode.HALF_UP));
        return response;
    }

    private double currentValue(AssetResponse asset) {
        return asset.getCurrentValue() != null ? asset.getCurrentValue().doubleValue() : 0.0;
    }

    private String buildNudgeMessage(double equityDrift, double debtDrift, double goldDrift, double thresholdPct) {
        double absEquity = Math.abs(equityDrift);
        double absDebt = Math.abs(debtDrift);
        double absGold = Math.abs(goldDrift);

        if (Math.max(absEquity, Math.max(absDebt, absGold)) <= thresholdPct) {
            return "Your allocation is within the drift threshold.";
        }

        if (absEquity >= absDebt && absEquity >= absGold) {
            return String.format("Equity has drifted by %.1f%% from target. Consider rebalancing.", equityDrift);
        }
        if (absDebt >= absGold) {
            return String.format("Debt has drifted by %.1f%% from target. Consider rebalancing.", debtDrift);
        }
        return String.format("Gold has drifted by %.1f%% from target. Consider rebalancing.", goldDrift);
    }
}
