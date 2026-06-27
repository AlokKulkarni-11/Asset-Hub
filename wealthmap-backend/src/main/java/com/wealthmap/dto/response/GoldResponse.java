package com.wealthmap.dto.response;

import com.wealthmap.enums.GoldPurity;
import lombok.Data;
import lombok.EqualsAndHashCode;
import java.math.BigDecimal;

@Data
@EqualsAndHashCode(callSuper = true)
public class GoldResponse extends AssetResponse {
    private BigDecimal weightInGrams;
    private GoldPurity purity;
    private BigDecimal purchasePrice;
}
