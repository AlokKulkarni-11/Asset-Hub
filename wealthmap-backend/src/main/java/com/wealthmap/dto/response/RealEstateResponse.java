package com.wealthmap.dto.response;

import lombok.Data;
import lombok.EqualsAndHashCode;
import java.math.BigDecimal;

@Data
@EqualsAndHashCode(callSuper = true)
public class RealEstateResponse extends AssetResponse {
    private String propertyName;
    private String propertyType;
    private BigDecimal purchasePrice;
    private BigDecimal estimatedCurrentValue;
}
