package com.wealthmap.dto.response;

import lombok.Data;
import lombok.EqualsAndHashCode;
import java.math.BigDecimal;

@Data
@EqualsAndHashCode(callSuper = true)
public class CryptoResponse extends AssetResponse {
    private String coinId;
    private String symbol;
    private BigDecimal units;
    private BigDecimal averageBuyPrice;
}
