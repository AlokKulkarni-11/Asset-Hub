package com.wealthmap.dto.request;

import com.wealthmap.enums.AssetType;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class PriceAlertRequest {
    private Long assetId;
    private String assetName;
    private AssetType assetType;
    private BigDecimal targetPrice;
    private String alertCondition;
}
