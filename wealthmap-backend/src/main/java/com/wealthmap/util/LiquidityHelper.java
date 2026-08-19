package com.wealthmap.util;

import com.wealthmap.dto.response.AssetResponse;
import com.wealthmap.enums.AssetType;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

public class LiquidityHelper {

    public static boolean isLiquidAsset(AssetResponse asset) {
        if (asset == null || asset.getAssetType() == null) {
            return true;
        }

        AssetType type = asset.getAssetType();

        if (type == AssetType.REAL_ESTATE) {
            return false;
        }

        if (type == AssetType.FIXED_DEPOSIT) {
            // FDs with purchase date older than 1 year or near maturity are considered liquid
            if (asset.getPurchaseDate() != null) {
                long days = ChronoUnit.DAYS.between(asset.getPurchaseDate(), LocalDate.now());
                if (days > 365) {
                    return true;
                }
            }
            return false;
        }

        // Gold, Stocks, Mutual Funds, Cryptocurrencies are Liquid (accessible within 24-48 hrs)
        return true;
    }

    public static double calculateLiquidTotal(List<AssetResponse> assets) {
        if (assets == null) return 0.0;
        return assets.stream()
                .filter(LiquidityHelper::isLiquidAsset)
                .mapToDouble(a -> a.getCurrentValue() != null ? a.getCurrentValue().doubleValue() : 0.0)
                .sum();
    }

    public static double calculateIlliquidTotal(List<AssetResponse> assets) {
        if (assets == null) return 0.0;
        return assets.stream()
                .filter(a -> !isLiquidAsset(a))
                .mapToDouble(a -> a.getCurrentValue() != null ? a.getCurrentValue().doubleValue() : 0.0)
                .sum();
    }
}
