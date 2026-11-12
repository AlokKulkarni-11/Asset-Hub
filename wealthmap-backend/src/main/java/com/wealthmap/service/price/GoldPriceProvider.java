package com.wealthmap.service.price;

import com.wealthmap.entity.GoldItem;
import com.wealthmap.entity.base.Asset;
import com.wealthmap.enums.AssetType;
import com.wealthmap.service.CurrencyConversionService;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
@RequiredArgsConstructor
public class GoldPriceProvider implements PriceProvider {

    private final RestTemplate restTemplate = new RestTemplate();
    private final CurrencyConversionService currencyConversionService;

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
        double multiplier = item.getPurity() != null ? item.getPurity().getMultiplier() : 1.0;
        BigDecimal weight = item.getWeightGrams() != null ? item.getWeightGrams() : BigDecimal.ZERO;
        BigDecimal pureWeight = weight.multiply(BigDecimal.valueOf(multiplier));
        
        BigDecimal pricePerGramINR = getCurrentGoldPrice();
        
        return pureWeight.multiply(pricePerGramINR).setScale(2, RoundingMode.HALF_UP);
    }

    @Cacheable(value = "goldPrice", key = "'current'")
    public BigDecimal getCurrentGoldPrice() {
        // 1. Primary: Official Indian market benchmark from IBJA (India Bullion & Jewellers Association)
        try {
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.set("User-Agent", "Mozilla/5.0");
            org.springframework.http.HttpEntity<String> entity = new org.springframework.http.HttpEntity<>(headers);

            String html = restTemplate.exchange("https://ibjarates.com/", org.springframework.http.HttpMethod.GET, entity, String.class).getBody();
            if (html != null) {
                java.util.regex.Matcher matcher = java.util.regex.Pattern
                        .compile("id=\"HdnGold\"[^>]*value=\"([^\"]+)\"")
                        .matcher(html);
                if (matcher.find()) {
                    String decodedJson = org.springframework.web.util.HtmlUtils.htmlUnescape(matcher.group(1));
                    com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                    com.fasterxml.jackson.databind.JsonNode root = mapper.readTree(decodedJson);
                    com.fasterxml.jackson.databind.JsonNode p999 = root.path("purity999");
                    if (p999.isArray() && p999.size() > 0) {
                        double per10g = p999.get(p999.size() - 1).asDouble();
                        if (per10g > 0) {
                            return BigDecimal.valueOf(per10g / 10.0).setScale(2, RoundingMode.HALF_UP);
                        }
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Failed to fetch IBJA Indian gold price, falling back to Yahoo Finance: " + e.getMessage());
        }

        // 2. Fallback: Yahoo Finance COMEX Gold Futures + USD/INR + Indian domestic premium
        try {
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.set("User-Agent", "Mozilla/5.0");
            org.springframework.http.HttpEntity<String> entity = new org.springframework.http.HttpEntity<>(headers);

            String goldUrl = "https://query2.finance.yahoo.com/v8/finance/chart/GC=F";
            String goldResp = restTemplate.exchange(goldUrl, org.springframework.http.HttpMethod.GET, entity, String.class).getBody();
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            com.fasterxml.jackson.databind.JsonNode goldNode = mapper.readTree(goldResp);
            double usdPerOunce = goldNode.path("chart").path("result").get(0).path("meta").path("regularMarketPrice").asDouble();

            BigDecimal usdToInr = currencyConversionService.getExchangeRate("USD", "INR");
            double inrPerOunce = usdPerOunce * usdToInr.doubleValue();
            double inrPerGram = inrPerOunce / 31.1034768;
            double indianDomesticPricePerGram = inrPerGram * 1.15;

            return BigDecimal.valueOf(indianDomesticPricePerGram).setScale(2, RoundingMode.HALF_UP);
        } catch (Exception e) {
            System.err.println("Failed to fetch live gold price: " + e.getMessage());
            return BigDecimal.valueOf(13769.20); // IBJA Nov 2026 fallback (INR/g 24K)
        }
    }
}
