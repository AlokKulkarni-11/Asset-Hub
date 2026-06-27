package com.wealthmap.dto.response;

import com.wealthmap.enums.CompoundingFrequency;
import lombok.Data;
import lombok.EqualsAndHashCode;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@EqualsAndHashCode(callSuper = true)
public class FixedDepositResponse extends AssetResponse {
    private String bankName;
    private LocalDate startDate;
    private LocalDate maturityDate;
    private BigDecimal principalAmount;
    private BigDecimal interestRate;
    private CompoundingFrequency compoundingFrequency;
}
