package com.wealthmap.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.wealthmap.dto.response.AnalyticsSummaryResponse;
import com.wealthmap.dto.response.EmergencyFundResponse;
import com.wealthmap.dto.response.HealthScoreResponse;
import com.wealthmap.dto.response.LiabilityResponse;
import com.wealthmap.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class HealthScoreService {

    private final AnalyticsService analyticsService;
    private final LiabilityService liabilityService;
    private final PlanningService planningService;
    private final GeminiService geminiService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Cacheable(value = "healthScore", key = "#user.id")
    public HealthScoreResponse calculateHealthScore(User user) {
        List<com.wealthmap.dto.response.AssetResponse> assets = analyticsService.getAllAssetsForUser(user.getEmail());
        List<LiabilityResponse> liabilities = liabilityService.getAllLiabilitiesForUser(user.getEmail());
        EmergencyFundResponse emergency = planningService.getEmergencyFund(user.getEmail());

        double totalAssetsVal = assets.stream().mapToDouble(a -> a.getCurrentValue() != null ? a.getCurrentValue().doubleValue() : 0.0).sum();
        BigDecimal totalAssets = BigDecimal.valueOf(totalAssetsVal).setScale(2, RoundingMode.HALF_UP);
        BigDecimal totalDebt = liabilities.stream()
                .map(l -> l.getOutstandingBalance() != null ? l.getOutstandingBalance() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 1. Debt-to-Asset Score (Weight: 30%)
        BigDecimal debtToAssetPct = BigDecimal.ZERO;
        int debtScore = 100;
        if (totalAssets.compareTo(BigDecimal.ZERO) > 0) {
            debtToAssetPct = totalDebt.divide(totalAssets, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100));
            double dRatio = debtToAssetPct.doubleValue();
            if (dRatio == 0) debtScore = 100;
            else if (dRatio <= 15) debtScore = 95;
            else if (dRatio <= 30) debtScore = 85;
            else if (dRatio <= 45) debtScore = 65;
            else if (dRatio <= 60) debtScore = 45;
            else if (dRatio <= 75) debtScore = 25;
            else debtScore = 10;
        } else if (totalDebt.compareTo(BigDecimal.ZERO) > 0) {
            debtScore = 10;
        }

        // 2. Liquidity Score (Weight: 25%)
        double liquidTotalVal = com.wealthmap.util.LiquidityHelper.calculateLiquidTotal(assets);
        BigDecimal liquidAmount = BigDecimal.valueOf(liquidTotalVal).setScale(2, RoundingMode.HALF_UP);
        BigDecimal liquidPercentage = BigDecimal.ZERO;
        int liquidityScore = 50;
        if (totalAssets.compareTo(BigDecimal.ZERO) > 0) {
            liquidPercentage = liquidAmount.divide(totalAssets, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100));
            double lPct = liquidPercentage.doubleValue();
            if (lPct >= 15 && lPct <= 35) liquidityScore = 100; // Ideal liquidity range
            else if ((lPct >= 10 && lPct < 15) || (lPct > 35 && lPct <= 50)) liquidityScore = 80;
            else if ((lPct >= 5 && lPct < 10) || (lPct > 50 && lPct <= 70)) liquidityScore = 60;
            else if (lPct < 5) liquidityScore = 30; // Highly illiquid risk
            else liquidityScore = 40; // High cash drag
        }

        // 3. Diversification Score (Weight: 25%)
        java.util.Map<String, Double> typeSums = new java.util.HashMap<>();
        for (com.wealthmap.dto.response.AssetResponse a : assets) {
            if (a.getAssetType() != null && a.getCurrentValue() != null) {
                String t = a.getAssetType().name();
                typeSums.put(t, typeSums.getOrDefault(t, 0.0) + a.getCurrentValue().doubleValue());
            }
        }
        double maxTypeValue = typeSums.values().stream().max(Double::compareTo).orElse(0.0);
        BigDecimal maxConcentrationPct = totalAssets.compareTo(BigDecimal.ZERO) > 0
                ? BigDecimal.valueOf((maxTypeValue / totalAssets.doubleValue()) * 100.0).setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        int diversificationScore = 50;
        double maxConc = maxConcentrationPct.doubleValue();
        if (totalAssets.compareTo(BigDecimal.ZERO) == 0) diversificationScore = 50;
        else if (maxConc <= 35) diversificationScore = 100;
        else if (maxConc <= 50) diversificationScore = 85;
        else if (maxConc <= 65) diversificationScore = 65;
        else if (maxConc <= 80) diversificationScore = 45;
        else diversificationScore = 25;

        // 4. Emergency Fund Score (Weight: 20%)
        BigDecimal monthsCovered = BigDecimal.ZERO;
        if (emergency != null && emergency.getMonthlyExpense() != null && emergency.getMonthlyExpense().compareTo(BigDecimal.ZERO) > 0) {
            monthsCovered = BigDecimal.valueOf(liquidAmount.doubleValue() / emergency.getMonthlyExpense().doubleValue()).setScale(1, RoundingMode.HALF_UP);
        }
        int emergencyScore = 20;
        double emMonths = monthsCovered.doubleValue();
        if (emMonths >= 6.0) emergencyScore = 100;
        else if (emMonths >= 4.0) emergencyScore = 80;
        else if (emMonths >= 2.0) emergencyScore = 60;
        else if (emMonths >= 1.0) emergencyScore = 40;
        else emergencyScore = 20;

        // Calculate Weighted Overall Composite Score (0 - 100)
        double composite = (debtScore * 0.30) + (liquidityScore * 0.25) + (diversificationScore * 0.25) + (emergencyScore * 0.20);
        int overallScore = (int) Math.round(composite);
        overallScore = Math.max(0, Math.min(100, overallScore));

        String grade;
        if (overallScore >= 85) grade = "EXCELLENT";
        else if (overallScore >= 70) grade = "GOOD";
        else if (overallScore >= 55) grade = "FAIR";
        else if (overallScore >= 40) grade = "NEEDS_ATTENTION";
        else grade = "CRITICAL";

        // Generate AI Reasoning & Actionable Tips (or deterministic fallback)
        String aiSummary = String.format("Your portfolio health score is %d/100 (%s). Debt levels stand at %.1f%% of assets with %.1f%% liquidity and %.1f months emergency coverage.",
                overallScore, grade, debtToAssetPct.doubleValue(), liquidPercentage.doubleValue(), emMonths);
        List<String> strengths = new ArrayList<>();
        List<String> improvementTips = new ArrayList<>();

        // Deterministic base points
        if (debtScore >= 80) strengths.add("Healthy debt management with low leverage relative to asset base.");
        else improvementTips.add("Prioritize paying off high-cost liabilities to reduce debt burden.");

        if (liquidityScore >= 80) strengths.add("Balanced liquidity split ensuring agile cashflow without cash drag.");
        else if (liquidPercentage.doubleValue() < 15) improvementTips.add("Increase liquid reserves (Savings, FDs, Liquid MFs) to prevent sudden distress sales.");
        else improvementTips.add("Deploy excess idle cash into long-term compounding assets to avoid inflation drag.");

        if (diversificationScore >= 80) strengths.add("Strong asset class diversification mitigating downside market volatility.");
        else improvementTips.add(String.format("Top asset class represents %.1f%% of portfolio — broaden allocation into other asset classes.", maxConc));

        if (emergencyScore >= 80) strengths.add("Robust emergency fund buffer exceeding recommended safety thresholds.");
        else improvementTips.add(String.format("Build towards 6 months of living expenses (currently %.1f months).", emMonths));

        // Call Gemini for enriched personalized AI narrative
        if (geminiService.isConfigured()) {
            try {
                String prompt = String.format(
                        "You are a CFA-certified financial advisor analyzing an Indian investor's portfolio health.\n" +
                        "Data:\n" +
                        "- Overall Score: %d/100 (Grade: %s)\n" +
                        "- Total Assets: ₹%s\n" +
                        "- Total Debt: ₹%s (Debt-to-Asset: %.1f%%)\n" +
                        "- Liquid Assets Ratio: %.1f%%\n" +
                        "- Largest Asset Concentration: %.1f%%\n" +
                        "- Emergency Fund Coverage: %.1f months\n\n" +
                        "Respond with a JSON object containing:\n" +
                        "{\n" +
                        "  \"summary\": \"2 concise, insightful sentences explaining why the score is what it is\",\n" +
                        "  \"strengths\": [\"1-2 key strong points\"],\n" +
                        "  \"improvementTips\": [\"2-3 highly specific, actionable steps to improve the score\"]\n" +
                        "}",
                        overallScore, grade, totalAssets, totalDebt, debtToAssetPct.doubleValue(),
                        liquidPercentage.doubleValue(), maxConc, emMonths
                );

                JsonNode aiJson = geminiService.generateStructuredJson(prompt);
                if (aiJson != null) {
                    if (aiJson.has("summary") && !aiJson.get("summary").asText().isEmpty()) {
                        aiSummary = aiJson.get("summary").asText();
                    }
                    if (aiJson.has("strengths") && aiJson.get("strengths").isArray()) {
                        List<String> aiStr = new ArrayList<>();
                        aiJson.get("strengths").forEach(n -> aiStr.add(n.asText()));
                        if (!aiStr.isEmpty()) strengths = aiStr;
                    }
                    if (aiJson.has("improvementTips") && aiJson.get("improvementTips").isArray()) {
                        List<String> aiTips = new ArrayList<>();
                        aiJson.get("improvementTips").forEach(n -> aiTips.add(n.asText()));
                        if (!aiTips.isEmpty()) improvementTips = aiTips;
                    }
                }
            } catch (Exception e) {
                log.warn("Gemini health score enrichment failed: {}", e.getMessage());
            }
        }

        return HealthScoreResponse.builder()
                .overallScore(overallScore)
                .grade(grade)
                .debtScore(debtScore)
                .liquidityScore(liquidityScore)
                .diversificationScore(diversificationScore)
                .emergencyFundScore(emergencyScore)
                .debtToAssetRatioPct(debtToAssetPct)
                .liquidPercentage(liquidPercentage)
                .emergencyFundMonthsCovered(monthsCovered)
                .maxAssetClassConcentrationPct(maxConcentrationPct)
                .aiSummary(aiSummary)
                .aiStrengths(strengths)
                .aiImprovementTips(improvementTips)
                .generatedAt(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")))
                .build();
    }
}
