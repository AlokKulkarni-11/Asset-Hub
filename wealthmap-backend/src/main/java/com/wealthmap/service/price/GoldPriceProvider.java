package com.wealthmap.service.price;

import com.wealthmap.entity.GoldItem;
import com.wealthmap.entity.base.Asset;
import com.wealthmap.enums.AssetType;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Map;

@Service
public class GoldPriceProvider implements PriceProvider {

    private final RestTemplate restTemplate = new RestTemplate();

    @Override
    public boolean supports(AssetType type) {
        return type == AssetType.GOLD;
    }

    @Override
    public BigDecimal getCurrentPrice(Asset asset) {
        if (!(asset instanceof GoldItem)) {
            throw new IllegalArgumentException("Asset must be GoldItem");
        }
        GoldItem item = (GoldItem) asset;
        
        // Purity multipliers
        double multiplier = item.getPurity().getMultiplier();
        BigDecimal pureWeight = item.getWeightGrams().multiply(BigDecimal.valueOf(multiplier));
        
        BigDecimal pricePerGramINR = getCurrentGoldPrice();
        
        return pureWeight.multiply(pricePerGramINR).setScale(2, RoundingMode.HALF_UP);
    }

    @Cacheable(value = "goldPrice", key = "'current'")
    public BigDecimal getCurrentGoldPrice() {
        try {
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.set("User-Agent", "Mozilla/5.0");
            org.springframework.http.HttpEntity<String> entity = new org.springframework.http.HttpEntity<>(headers);
            
            // Get Gold price in USD per Troy Ounce
            String goldUrl = "https://query2.finance.yahoo.com/v8/finance/chart/GC=F";
            String goldResp = restTemplate.exchange(goldUrl, org.springframework.http.HttpMethod.GET, entity, String.class).getBody();
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            com.fasterxml.jackson.databind.JsonNode goldNode = mapper.readTree(goldResp);
            double usdPerOunce = goldNode.path("chart").path("result").get(0).path("meta").path("regularMarketPrice").asDouble();
            
            // Get USD to INR rate
            String inrUrl = "https://query2.finance.yahoo.com/v8/finance/chart/INR=X";
            String inrResp = restTemplate.exchange(inrUrl, org.springframework.http.HttpMethod.GET, entity, String.class).getBody();
            com.fasterxml.jackson.databind.JsonNode inrNode = mapper.readTree(inrResp);
            double usdToInr = inrNode.path("chart").path("result").get(0).path("meta").path("regularMarketPrice").asDouble();
            
            // Convert to INR per Gram (1 Troy Ounce = 31.1034768 grams)
            double inrPerOunce = usdPerOunce * usdToInr;
            double inrPerGram = inrPerOunce / 31.1034768;
            
            // Add 15% to simulate Indian domestic physical gold price (import duty + premium)
            double indianDomesticPricePerGram = inrPerGram * 1.15;
            
            return BigDecimal.valueOf(indianDomesticPricePerGram);
        } catch (Exception e) {
            System.err.println("Failed to fetch live gold price: " + e.getMessage());
            return BigDecimal.valueOf(7350.00); // Realistic fallback for India 2024
        }
    }
}
