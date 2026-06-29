package com.wealthmap.service.price;

import com.wealthmap.entity.RealEstate;
import com.wealthmap.entity.base.Asset;
import com.wealthmap.enums.AssetType;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class RealEstatePriceProvider implements PriceProvider {

    @Override
    public boolean supports(AssetType assetType) {
        return assetType == AssetType.REAL_ESTATE;
    }

    @Override
    public BigDecimal getCurrentPrice(Asset asset) {
        if (asset instanceof RealEstate re) {
            if (re.getEstimatedCurrentValue() != null) {
                return re.getEstimatedCurrentValue();
            }
            return re.getInvestedAmount();
        }
        return asset.getInvestedAmount();
    }
}
