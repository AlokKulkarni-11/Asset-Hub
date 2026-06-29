package com.wealthmap.service.price;

import com.wealthmap.entity.base.Asset;
import com.wealthmap.entity.FixedDeposit;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

@Component
public class FormulaBasedPriceProvider implements PriceProvider {

    @Override
    public boolean supports(com.wealthmap.enums.AssetType assetType) {
        return assetType == com.wealthmap.enums.AssetType.FIXED_DEPOSIT || 
               assetType == com.wealthmap.enums.AssetType.RECURRING_DEPOSIT || 
               assetType == com.wealthmap.enums.AssetType.PPF;
    }

    @Override
    public BigDecimal getCurrentPrice(Asset asset) {
        if (asset instanceof FixedDeposit fd) {
            return calculateFDValue(fd, LocalDate.now());
        }
        return asset.getInvestedAmount();
    }

    private BigDecimal calculateFDValue(FixedDeposit fd, LocalDate targetDate) {
        if (targetDate.isBefore(fd.getStartDate())) {
            return fd.getPrincipalAmount();
        }
        
        LocalDate endDate = targetDate.isAfter(fd.getMaturityDate()) ? fd.getMaturityDate() : targetDate;
        
        long daysElapsed = ChronoUnit.DAYS.between(fd.getStartDate(), endDate);
        double yearsElapsed = daysElapsed / 365.25;

        // A = P(1 + r/n)^(nt)
        double p = fd.getPrincipalAmount().doubleValue();
        double r = fd.getInterestRate().doubleValue() / 100.0;
        int n = fd.getCompoundingFrequency() != null ? fd.getCompoundingFrequency().getPeriodsPerYear() : 1;
        
        double amount = p * Math.pow(1 + (r / n), n * yearsElapsed);
        
        return BigDecimal.valueOf(amount).setScale(2, RoundingMode.HALF_UP);
    }
}
