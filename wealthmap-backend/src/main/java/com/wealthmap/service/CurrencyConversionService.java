package com.wealthmap.service;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.Map;

@Service
public class CurrencyConversionService {

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    // Default fallback rates (INR per 1 unit of foreign currency) in case external API fails or is offline
    private static final Map<String, BigDecimal> FALLBACK_RATES_TO_INR = Map.of(
            "INR", BigDecimal.ONE,
            "USD", new BigDecimal("83.95"),
            "EUR", new BigDecimal("91.50"),
            "GBP", new BigDecimal("107.20"),
            "AED", new BigDecimal("22.85"),
            "SGD", new BigDecimal("64.20"),
            "CAD", new BigDecimal("61.80"),
            "AUD", new BigDecimal("55.50"),
            "JPY", new BigDecimal("0.58"),
            "CHF", new BigDecimal("97.80")
    );

    /**
     * Returns the exchange rate to convert 1 unit of fromCurrency into toCurrency.
     * Example: getExchangeRate("USD", "INR") -> ~83.95
     */
    @Cacheable(value = "forexRates", key = "#fromCurrency.toUpperCase() + '_' + #toCurrency.toUpperCase()")
    public BigDecimal getExchangeRate(String fromCurrency, String toCurrency) {
        if (fromCurrency == null || fromCurrency.trim().isEmpty()) fromCurrency = "INR";
        if (toCurrency == null || toCurrency.trim().isEmpty()) toCurrency = "INR";

        fromCurrency = fromCurrency.trim().toUpperCase();
        toCurrency = toCurrency.trim().toUpperCase();

        if (fromCurrency.equals(toCurrency)) {
            return BigDecimal.ONE;
        }

        // Direct lookup if converting to INR
        if (toCurrency.equals("INR")) {
            return fetchLiveRateToInr(fromCurrency);
        }

        // Converting from INR to Foreign Currency: 1 / rateToInr
        if (fromCurrency.equals("INR")) {
            BigDecimal rateToInr = fetchLiveRateToInr(toCurrency);
            if (rateToInr.compareTo(BigDecimal.ZERO) > 0) {
                return BigDecimal.ONE.divide(rateToInr, 6, RoundingMode.HALF_UP);
            }
            return BigDecimal.ONE;
        }

        // Cross-currency conversion (e.g. USD to EUR) -> (USD to INR) / (EUR to INR)
        BigDecimal fromInr = fetchLiveRateToInr(fromCurrency);
        BigDecimal toInr = fetchLiveRateToInr(toCurrency);
        if (toInr.compareTo(BigDecimal.ZERO) > 0) {
            return fromInr.divide(toInr, 6, RoundingMode.HALF_UP);
        }

        return BigDecimal.ONE;
    }

    /**
     * Converts a given amount from fromCurrency to toCurrency
     */
    public BigDecimal convert(BigDecimal amount, String fromCurrency, String toCurrency) {
        if (amount == null) return BigDecimal.ZERO;
        BigDecimal rate = getExchangeRate(fromCurrency, toCurrency);
        return amount.multiply(rate).setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Returns a map of all supported currency exchange rates against INR
     */
    public Map<String, BigDecimal> getAllRatesAgainstInr() {
        Map<String, BigDecimal> rates = new HashMap<>();
        for (String cur : FALLBACK_RATES_TO_INR.keySet()) {
            rates.put(cur, getExchangeRate(cur, "INR"));
        }
        return rates;
    }

    /**
     * Internal helper to fetch live rate from Yahoo Finance with fallback
     */
    private BigDecimal fetchLiveRateToInr(String currency) {
        if ("INR".equals(currency)) return BigDecimal.ONE;

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)");
            HttpEntity<String> entity = new HttpEntity<>(headers);

            // Yahoo Finance symbol: For USD->INR, it can be INR=X or USDINR=X. For others: EURINR=X, GBPINR=X, AEDINR=X, etc.
            String symbol = currency.equals("USD") ? "INR=X" : currency + "INR=X";
            String url = "https://query2.finance.yahoo.com/v8/finance/chart/" + symbol;

            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);
            JsonNode root = objectMapper.readTree(response.getBody());
            double price = root.path("chart").path("result").get(0).path("meta").path("regularMarketPrice").asDouble();

            if (price > 0) {
                return BigDecimal.valueOf(price).setScale(4, RoundingMode.HALF_UP);
            }
        } catch (Exception e) {
            System.err.println("Failed to fetch live forex rate for " + currency + " to INR: " + e.getMessage());
        }

        return FALLBACK_RATES_TO_INR.getOrDefault(currency, BigDecimal.ONE);
    }
}
