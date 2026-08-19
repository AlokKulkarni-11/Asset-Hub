package com.wealthmap.service.price;

import com.wealthmap.entity.Cryptocurrency;
import com.wealthmap.entity.base.Asset;
import com.wealthmap.enums.AssetType;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Map;

@Service
public class CryptoPriceProvider implements PriceProvider {

    private final RestTemplate restTemplate = new RestTemplate();

    @Override
    public boolean supports(AssetType type) {
        return type == AssetType.CRYPTOCURRENCY;
    }

    @Override
    public BigDecimal getCurrentPrice(Asset asset) {
        if (!(asset instanceof Cryptocurrency)) {
            throw new IllegalArgumentException("Asset must be Cryptocurrency");
        }
        Cryptocurrency crypto = (Cryptocurrency) asset;
        
        if (crypto.getCoinId() == null || crypto.getCoinId().isEmpty()) {
            return crypto.getInvestedAmount();
        }

        BigDecimal pricePerUnit = getCryptoPrice(crypto.getCoinId());
        BigDecimal units = crypto.getUnits() != null ? crypto.getUnits() : BigDecimal.ZERO;
        
        return units.multiply(pricePerUnit).setScale(2, RoundingMode.HALF_UP);
    }

    @Cacheable(value = "cryptoPrice", key = "#coinId")
    public BigDecimal getCryptoPrice(String coinId) {
        try {
            String url = "https://api.coingecko.com/api/v3/simple/price?ids=" + coinId + "&vs_currencies=inr";
            
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.set("User-Agent", "Mozilla/5.0");
            org.springframework.http.HttpEntity<String> entity = new org.springframework.http.HttpEntity<>(headers);
            
            String response = restTemplate.exchange(url, org.springframework.http.HttpMethod.GET, entity, String.class).getBody();
            
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            com.fasterxml.jackson.databind.JsonNode rootNode = mapper.readTree(response);
            
            double priceInr = rootNode.path(coinId).path("inr").asDouble();
            
            if (priceInr > 0) {
                return BigDecimal.valueOf(priceInr);
            }
        } catch (Exception e) {
            System.err.println("Failed to fetch live crypto price for " + coinId + ": " + e.getMessage());
        }
        // Return a realistic fallback or 0.0 if API fails, so that we don't crash
        return BigDecimal.ZERO;
    }
}
