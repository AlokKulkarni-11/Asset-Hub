package com.wealthmap.dto.response;

import com.wealthmap.enums.AssetType;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class PriceAlertResponse {
    private Long id;
    private Long assetId;
    private String assetName;
    private AssetType assetType;
    private BigDecimal targetPrice;
    private String alertCondition;
    private boolean active;
    private BigDecimal lastObservedPrice;
    private LocalDateTime lastTriggeredAt;
    private LocalDateTime createdAt;
}
