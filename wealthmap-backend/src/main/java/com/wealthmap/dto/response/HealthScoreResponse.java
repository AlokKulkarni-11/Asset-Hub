package com.wealthmap.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HealthScoreResponse {
    private int overallScore; // 0 - 100
    private String grade; // "EXCELLENT", "GOOD", "FAIR", "NEEDS_ATTENTION", "CRITICAL"
    
    // Sub-scores (0-100 each)
    private int debtScore;
    private int liquidityScore;
    private int diversificationScore;
    private int emergencyFundScore;

    // Actual underlying financial metrics
    private BigDecimal debtToAssetRatioPct;
    private BigDecimal liquidPercentage;
    private BigDecimal emergencyFundMonthsCovered;
    private BigDecimal maxAssetClassConcentrationPct;

    // AI-generated reasoning & suggestions
    private String aiSummary;
    private List<String> aiStrengths;
    private List<String> aiImprovementTips;
    private String generatedAt;
}
