package com.wealthmap.dto.response;

import com.wealthmap.enums.EsopPlanType;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@EqualsAndHashCode(callSuper = true)
public class EsopRsuResponse extends AssetResponse {
    private EsopPlanType planType;
    private String companyName;
    private String ticker;
    private LocalDate grantDate;
    private LocalDate vestingStartDate;
    private BigDecimal totalUnitsGranted;
    private BigDecimal vestedUnits;
    private BigDecimal unvestedUnits;
    private BigDecimal strikePrice;
    private BigDecimal currentStockPrice;
    private String currency;
    
    // Calculated equity splits
    private BigDecimal vestedValue;
    private BigDecimal unvestedValue;
    private BigDecimal exercisableGain;
    private BigDecimal totalPotentialValue;
    private Boolean isLivePrice;
}
