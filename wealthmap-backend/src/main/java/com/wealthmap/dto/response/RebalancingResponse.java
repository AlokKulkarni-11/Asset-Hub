package com.wealthmap.dto.response;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class RebalancingResponse {
    private double targetEquityPct;
    private double targetDebtPct;
    private double targetGoldPct;
    
    private double currentEquityPct;
    private double currentDebtPct;
    private double currentGoldPct;

    private double equityDriftPct;
    private double debtDriftPct;
    private double goldDriftPct;

    private double driftThresholdPct;

    private boolean needsRebalancing;
    private String nudgeMessage;
    private BigDecimal recommendedEquityAdjustment;
    private BigDecimal recommendedDebtAdjustment;
    private BigDecimal recommendedGoldAdjustment;
}
