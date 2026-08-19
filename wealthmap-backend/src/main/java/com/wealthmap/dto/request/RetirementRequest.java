package com.wealthmap.dto.request;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class RetirementRequest {
    private int currentAge = 30;
    private int retirementAge = 60;
    private BigDecimal desiredMonthlyExpenseToday;
    private double expectedReturnRate = 10.0;
    private double inflationRate = 6.0;
}
