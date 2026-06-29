package com.wealthmap.service.price;

import com.wealthmap.entity.base.Asset;
import com.wealthmap.enums.AssetType;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class PriceProviderFactory {
    private final GoldPriceProvider goldPriceProvider;
    private final FormulaBasedPriceProvider formulaBasedPriceProvider;
    private final StockPriceProvider stockPriceProvider;
    private final MutualFundPriceProvider mutualFundPriceProvider;
    private final RealEstatePriceProvider realEstatePriceProvider;

    public PriceProviderFactory(GoldPriceProvider goldPriceProvider, 
                                FormulaBasedPriceProvider formulaBasedPriceProvider,
                                StockPriceProvider stockPriceProvider,
                                MutualFundPriceProvider mutualFundPriceProvider,
                                RealEstatePriceProvider realEstatePriceProvider) {
        this.goldPriceProvider = goldPriceProvider;
        this.formulaBasedPriceProvider = formulaBasedPriceProvider;
        this.stockPriceProvider = stockPriceProvider;
        this.mutualFundPriceProvider = mutualFundPriceProvider;
        this.realEstatePriceProvider = realEstatePriceProvider;
    }

    public PriceProvider getProvider(AssetType assetType) {
        switch (assetType) {
            case GOLD:
                return goldPriceProvider;
            case STOCK:
                return stockPriceProvider;
            case MUTUAL_FUND:
                return mutualFundPriceProvider;
            case REAL_ESTATE:
                return realEstatePriceProvider;
            case FIXED_DEPOSIT:
            case PPF:
            case RECURRING_DEPOSIT:
                return formulaBasedPriceProvider;
            default:
                throw new IllegalArgumentException("No price provider found for asset type: " + assetType);
        }
    }
}
