package com.wealthmap.service.price;

import com.wealthmap.entity.Bond;
import com.wealthmap.entity.base.Asset;
import com.wealthmap.enums.AssetType;
import com.wealthmap.enums.BondType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

@Component
@RequiredArgsConstructor
public class BondPriceProvider implements PriceProvider {

    private final GoldPriceProvider goldPriceProvider;

    @Override
    public boolean supports(AssetType assetType) {
        return assetType == AssetType.BOND ||
               assetType == AssetType.SOVEREIGN_GOLD_BOND ||
               assetType == AssetType.PPF;
    }

    @Override
    public BigDecimal getCurrentPrice(Asset asset) {
        if (asset instanceof Bond bond) {
            return calculateBondValue(bond, LocalDate.now());
        }
        return asset.getInvestedAmount();
    }

    public BigDecimal calculateBondValue(Bond bond, LocalDate targetDate) {
        LocalDate startDate = bond.getStartDate() != null ? bond.getStartDate() : bond.getPurchaseDate();
        if (startDate == null || targetDate.isBefore(startDate)) {
            return bond.getInvestedAmount();
        }

        LocalDate endDate = bond.getMaturityDate() != null && targetDate.isAfter(bond.getMaturityDate())
                ? bond.getMaturityDate()
                : targetDate;

        long daysElapsed = Math.max(0, ChronoUnit.DAYS.between(startDate, endDate));
        double yearsElapsed = daysElapsed / 365.25;

        BigDecimal principal = bond.getInvestedAmount();
        double p = principal.doubleValue();
        double r = bond.getCouponRate() != null ? bond.getCouponRate().doubleValue() / 100.0 : 0.07; // default 7%

        // Special valuation for Sovereign Gold Bonds (SGB)
        if (bond.getBondType() == BondType.SOVEREIGN_GOLD_BOND) {
            // SGB value = Current Gold Value of grams + 2.5% annual coupon interest accrued
            double goldGrams = bond.getQuantity() != null ? bond.getQuantity().doubleValue() : (p / 5000.0);
            BigDecimal liveGoldRate = goldPriceProvider.getCurrentGoldPrice();
            double currentGoldRatePerGram = liveGoldRate != null ? liveGoldRate.doubleValue() : 7200.0;
            double goldValue = goldGrams * currentGoldRatePerGram;
            double accruedCoupon = p * r * yearsElapsed;
            return BigDecimal.valueOf(goldValue + accruedCoupon).setScale(2, RoundingMode.HALF_UP);
        }

        // Standard compounding or simple interest for Govt & Corporate Bonds, PPF, NPS
        int n = bond.getCompoundingFrequency() != null ? bond.getCompoundingFrequency().getPeriodsPerYear() : 1;
        double amount = p * Math.pow(1.0 + (r / n), n * yearsElapsed);

        return BigDecimal.valueOf(amount).setScale(2, RoundingMode.HALF_UP);
    }
}
