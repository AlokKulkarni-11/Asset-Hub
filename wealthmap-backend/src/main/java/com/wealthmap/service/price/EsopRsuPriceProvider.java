package com.wealthmap.service.price;

import com.wealthmap.entity.EsopRsu;
import com.wealthmap.entity.base.Asset;
import com.wealthmap.enums.AssetType;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Component
public class EsopRsuPriceProvider implements PriceProvider {

    @Override
    public boolean supports(AssetType assetType) {
        return assetType == AssetType.ESOP_RSU;
    }

    @Override
    public BigDecimal getCurrentPrice(Asset asset) {
        if (asset instanceof EsopRsu esop) {
            BigDecimal perSharePrice = fetchLiveOrEstimatedPrice(esop);
            BigDecimal vestedUnits = esop.getVestedUnits() != null ? esop.getVestedUnits() : BigDecimal.ZERO;
            return vestedUnits.multiply(perSharePrice).setScale(2, RoundingMode.HALF_UP);
        }
        return asset.getInvestedAmount();
    }

    public BigDecimal fetchLiveOrEstimatedPrice(EsopRsu esop) {
        if (esop.getTicker() != null && !esop.getTicker().trim().isEmpty()) {
            try {
                org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();
                org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
                headers.set("User-Agent", "Mozilla/5.0");
                org.springframework.http.HttpEntity<String> entity = new org.springframework.http.HttpEntity<>(headers);

                String url = "https://query2.finance.yahoo.com/v8/finance/chart/" + esop.getTicker().trim();
                String response = restTemplate.exchange(url, org.springframework.http.HttpMethod.GET, entity, String.class).getBody();

                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                com.fasterxml.jackson.databind.JsonNode rootNode = mapper.readTree(response);
                double livePrice = rootNode.path("chart").path("result").get(0).path("meta").path("regularMarketPrice").asDouble();
                if (livePrice > 0) {
                    return BigDecimal.valueOf(livePrice);
                }
            } catch (Exception e) {
                System.err.println("Failed to fetch live ticker for ESOP " + esop.getTicker() + ": " + e.getMessage());
            }
        }
        return esop.getCurrentStockPrice() != null ? esop.getCurrentStockPrice() : BigDecimal.ZERO;
    }
}
