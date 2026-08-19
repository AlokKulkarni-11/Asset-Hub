package com.wealthmap.dto.request;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class EmergencyFundRequest {
    private BigDecimal monthlyExpense;
    private int targetMonths;
}
