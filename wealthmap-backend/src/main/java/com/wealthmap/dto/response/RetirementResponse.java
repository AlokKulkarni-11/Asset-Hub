package com.wealthmap.dto.response;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class RetirementResponse {
    private int yearsToRetirement;
    private BigDecimal inflationAdjustedMonthlyExpense;
    private BigDecimal requiredRetirementCorpus;
    private BigDecimal projectedNetWorthAtRetirement;
    private BigDecimal shortfallOrSurplus;
    private double readinessPercentage;
}
