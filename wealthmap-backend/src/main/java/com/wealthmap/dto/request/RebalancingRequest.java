package com.wealthmap.dto.request;

import lombok.Data;

@Data
public class RebalancingRequest {
    private double targetEquityPct;
    private double targetDebtPct;
    private double targetGoldPct;
    private double driftThresholdPct = 5.0;
}
