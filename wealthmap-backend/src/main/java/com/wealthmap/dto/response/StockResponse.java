package com.wealthmap.dto.response;

import lombok.Data;
import lombok.EqualsAndHashCode;
import java.math.BigDecimal;

@Data
@EqualsAndHashCode(callSuper = true)
public class StockResponse extends AssetResponse {
    private String ticker;
    private String companyName;
    private BigDecimal quantity;
    private BigDecimal averageBuyPrice;
}
