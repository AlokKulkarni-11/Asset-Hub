package com.wealthmap.service.price;

import com.wealthmap.entity.SilverItem;
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
public class SilverPriceProvider implements PriceProvider {

    private final RestTemplate restTemplate = new RestTemplate();
    private final CurrencyConversionService currencyConversionService;

    @Override
    public boolean supports(AssetType type) {
        return type == AssetType.SILVER;
    }

    @Override
    public BigDecimal getCurrentPrice(Asset asset) {
        if (!(asset instanceof SilverItem)) {
            throw new IllegalArgumentException("Asset must be SilverItem");
        }
        SilverItem item = (SilverItem) asset;

        double multiplier = item.getPurity() != null ? item.getPurity().getMultiplier() : 0.999;
        BigDecimal weight = item.getWeightGrams() != null ? item.getWeightGrams() : BigDecimal.ZERO;
        BigDecimal pureWeight = weight.multiply(BigDecimal.valueOf(multiplier));

        BigDecimal pricePerGramINR = getCurrentSilverPrice();

        return pureWeight.multiply(pricePerGramINR).setScale(2, RoundingMode.HALF_UP);
    }

    @Cacheable(value = "silverPrice", key = "'current'")
    public BigDecimal getCurrentSilverPrice() {
        // 1. Primary: Official Indian market benchmark from IBJA (India Bullion & Jewellers Association)
        try {
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.set("User-Agent", "Mozilla/5.0");
            org.springframework.http.HttpEntity<String> entity = new org.springframework.http.HttpEntity<>(headers);

            String html = restTemplate.exchange("https://ibjarates.com/", org.springframework.http.HttpMethod.GET, entity, String.class).getBody();
            if (html != null) {
                java.util.regex.Matcher matcher = java.util.regex.Pattern
                        .compile("id=\"HdnSilver\"[^>]*value=\"([^\"]+)\"")
                        .matcher(html);
                if (matcher.find()) {
                    String decodedJson = org.springframework.web.util.HtmlUtils.htmlUnescape(matcher.group(1));
                    com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                    com.fasterxml.jackson.databind.JsonNode root = mapper.readTree(decodedJson);
                    com.fasterxml.jackson.databind.JsonNode silverRate = root.path("silverRate");
                    if (silverRate.isArray() && silverRate.size() > 0) {
                        double perKg = silverRate.get(silverRate.size() - 1).asDouble();
                        if (perKg > 0) {
                            return BigDecimal.valueOf(perKg / 1000.0).setScale(2, RoundingMode.HALF_UP);
                        }
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Failed to fetch IBJA Indian silver price, falling back to Yahoo Finance: " + e.getMessage());
        }

        // 2. Fallback: Yahoo Finance Silver Futures + USD/INR + Indian domestic premium
        try {
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.set("User-Agent", "Mozilla/5.0");
            org.springframework.http.HttpEntity<String> entity = new org.springframework.http.HttpEntity<>(headers);

            String silverUrl = "https://query2.finance.yahoo.com/v8/finance/chart/SI=F";
            String silverResp = restTemplate.exchange(silverUrl, org.springframework.http.HttpMethod.GET, entity, String.class).getBody();
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            com.fasterxml.jackson.databind.JsonNode silverNode = mapper.readTree(silverResp);
            double usdPerOunce = silverNode.path("chart").path("result").get(0).path("meta").path("regularMarketPrice").asDouble();

            BigDecimal usdToInr = currencyConversionService.getExchangeRate("USD", "INR");
            double inrPerOunce = usdPerOunce * usdToInr.doubleValue();
            double inrPerGram = inrPerOunce / 31.1034768;
            double indianDomesticPricePerGram = inrPerGram * 1.15;

            return BigDecimal.valueOf(indianDomesticPricePerGram).setScale(2, RoundingMode.HALF_UP);
        } catch (Exception e) {
            System.err.println("Failed to fetch live silver price: " + e.getMessage());
            return BigDecimal.valueOf(181.04); // IBJA Nov 2026 fallback (INR/g 999)
        }
    }
}
