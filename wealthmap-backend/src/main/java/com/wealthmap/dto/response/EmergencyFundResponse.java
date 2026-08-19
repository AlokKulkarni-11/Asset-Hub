package com.wealthmap.dto.response;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class EmergencyFundResponse {
    private Long id;
    private BigDecimal monthlyExpense;
    private int targetMonths;
    private BigDecimal targetCorpus;
    private BigDecimal currentLiquidAssets;
    private double progressPercentage;
}
