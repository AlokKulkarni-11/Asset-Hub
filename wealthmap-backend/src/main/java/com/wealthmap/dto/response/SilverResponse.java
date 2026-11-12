package com.wealthmap.dto.response;

import com.wealthmap.enums.SilverPurity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;

@Data
@EqualsAndHashCode(callSuper = true)
public class SilverResponse extends AssetResponse {
    private BigDecimal weightInGrams;
    private SilverPurity purity;
    private BigDecimal purchasePrice;
}
