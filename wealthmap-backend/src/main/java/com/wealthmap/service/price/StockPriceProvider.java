package com.wealthmap.service.price;

import com.wealthmap.entity.Stock;
import com.wealthmap.entity.base.Asset;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Component
public class StockPriceProvider implements PriceProvider {

    @Override
    public boolean supports(com.wealthmap.enums.AssetType assetType) {
        return assetType == com.wealthmap.enums.AssetType.STOCK;
    }

    @Override
    public BigDecimal getCurrentPrice(Asset asset) {
        if (asset instanceof Stock stock) {
            try {
                org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();
                org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
                headers.set("User-Agent", "Mozilla/5.0");
                org.springframework.http.HttpEntity<String> entity = new org.springframework.http.HttpEntity<>(headers);
                
                String url = "https://query2.finance.yahoo.com/v8/finance/chart/" + stock.getTicker();
                String response = restTemplate.exchange(url, org.springframework.http.HttpMethod.GET, entity, String.class).getBody();
                
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                com.fasterxml.jackson.databind.JsonNode rootNode = mapper.readTree(response);
                double currentPrice = rootNode.path("chart").path("result").get(0).path("meta").path("regularMarketPrice").asDouble();
                BigDecimal qty = stock.getQuantity() != null ? stock.getQuantity() : BigDecimal.ONE;
                return BigDecimal.valueOf(currentPrice).multiply(qty).setScale(2, RoundingMode.HALF_UP);
            } catch (Exception e) {
                System.err.println("Failed to fetch live stock price for " + stock.getTicker() + ": " + e.getMessage());
                // Fallback if API fails
                return stock.getInvestedAmount();
            }
        }
        return asset.getInvestedAmount();
    }
}
