package com.wealthmap.service.price;

import com.wealthmap.entity.base.Asset;
import com.wealthmap.enums.AssetType;

import java.math.BigDecimal;

public interface PriceProvider {
    BigDecimal getCurrentPrice(Asset asset);
    boolean supports(AssetType type);
}
