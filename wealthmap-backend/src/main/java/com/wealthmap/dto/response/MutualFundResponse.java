package com.wealthmap.dto.response;

import lombok.Data;
import lombok.EqualsAndHashCode;
import java.math.BigDecimal;

@Data
@EqualsAndHashCode(callSuper = true)
public class MutualFundResponse extends AssetResponse {
    private String schemeCode;
    private String schemeName;
    private String folioNumber;
    private BigDecimal units;
    private BigDecimal averageNav;
    private BigDecimal currentNav;
}
