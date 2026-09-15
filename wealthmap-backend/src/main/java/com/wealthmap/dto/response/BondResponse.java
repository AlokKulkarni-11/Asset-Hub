package com.wealthmap.dto.response;

import com.wealthmap.enums.BondType;
import com.wealthmap.enums.CompoundingFrequency;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@EqualsAndHashCode(callSuper = true)
public class BondResponse extends AssetResponse {
    private BondType bondType;
    private String issuer;
    private BigDecimal couponRate;
    private BigDecimal faceValue;
    private BigDecimal quantity;
    private CompoundingFrequency compoundingFrequency;
    private BigDecimal accruedInterest;
    private BigDecimal maturityAmount;
    private Long daysToMaturity;
}
