package com.wealthmap.dto.response;

import com.wealthmap.enums.AssetType;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class AssetResponse {
    private Long id;
    private String name;
    private AssetType assetType;
    private LocalDate purchaseDate;
    private String notes;
    private Long familyMemberId;
    private String familyMemberName;
    private BigDecimal investedAmount;
    private BigDecimal currentValue;
    private BigDecimal gainLoss;
    private BigDecimal gainPercent;
}
