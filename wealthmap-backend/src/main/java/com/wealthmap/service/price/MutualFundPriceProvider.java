package com.wealthmap.service.price;

import com.wealthmap.entity.MutualFund;
import com.wealthmap.entity.base.Asset;
import com.wealthmap.enums.AssetType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class MutualFundPriceProvider implements PriceProvider {

    private final RestTemplate restTemplate = new RestTemplate();
    private final Map<String, BigDecimal> navCache = new ConcurrentHashMap<>();
    private long lastFetchTime = 0;
    private static final long CACHE_EXPIRY_MS = 12 * 60 * 60 * 1000; // 12 hours

    @Override
    public boolean supports(AssetType assetType) {
        return assetType == AssetType.MUTUAL_FUND;
    }

    private void refreshCacheIfNeeded() {
        if (System.currentTimeMillis() - lastFetchTime > CACHE_EXPIRY_MS || navCache.isEmpty()) {
            try {
                String url = "https://www.amfiindia.com/spages/NAVAll.txt";
                String response = restTemplate.getForObject(url, String.class);
                if (response != null) {
                    String[] lines = response.split("\n");
                    for (String line : lines) {
                        String[] parts = line.split(";");
                        if (parts.length >= 5) {
                            try {
                                String schemeCode = parts[0].trim();
                                BigDecimal nav = new BigDecimal(parts[4].trim());
                                navCache.put(schemeCode, nav);
                            } catch (NumberFormatException ignored) {
                                // Skip header lines or invalid data
                            }
                        }
                    }
                    lastFetchTime = System.currentTimeMillis();
                }
            } catch (Exception e) {
                System.err.println("Failed to fetch NAVAll.txt from AMFI: " + e.getMessage());
            }
        }
    }

    @Override
    public BigDecimal getCurrentPrice(Asset asset) {
        if (asset instanceof MutualFund mf) {
            if (mf.getSchemeCode() == null || mf.getSchemeCode().isEmpty()) {
                return mf.getInvestedAmount();
            }
            
            refreshCacheIfNeeded();
            
            BigDecimal nav = navCache.get(mf.getSchemeCode());
            if (nav != null) {
                BigDecimal units = mf.getUnits() != null ? mf.getUnits() : BigDecimal.ZERO;
                return units.multiply(nav).setScale(2, RoundingMode.HALF_UP);
            }
            
            // Fallback
            return mf.getInvestedAmount();
        }
        return asset.getInvestedAmount();
    }
}
