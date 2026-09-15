package com.wealthmap.controller;

import com.wealthmap.service.CurrencyConversionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/forex")
@RequiredArgsConstructor
public class ForexController {

    private final CurrencyConversionService currencyConversionService;

    @GetMapping("/rates")
    public ResponseEntity<Map<String, BigDecimal>> getAllRatesAgainstInr() {
        return ResponseEntity.ok(currencyConversionService.getAllRatesAgainstInr());
    }

    @GetMapping("/rate")
    public ResponseEntity<BigDecimal> getExchangeRate(
            @RequestParam(defaultValue = "USD") String from,
            @RequestParam(defaultValue = "INR") String to
    ) {
        return ResponseEntity.ok(currencyConversionService.getExchangeRate(from, to));
    }

    @GetMapping("/convert")
    public ResponseEntity<Map<String, Object>> convert(
            @RequestParam BigDecimal amount,
            @RequestParam(defaultValue = "USD") String from,
            @RequestParam(defaultValue = "INR") String to
    ) {
        BigDecimal rate = currencyConversionService.getExchangeRate(from, to);
        BigDecimal convertedAmount = currencyConversionService.convert(amount, from, to);

        return ResponseEntity.ok(Map.of(
                "originalAmount", amount,
                "fromCurrency", from.toUpperCase(),
                "toCurrency", to.toUpperCase(),
                "exchangeRate", rate,
                "convertedAmount", convertedAmount
        ));
    }
}
