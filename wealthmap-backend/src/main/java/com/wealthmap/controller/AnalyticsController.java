package com.wealthmap.controller;

import com.wealthmap.dto.request.WhatIfRequest;
import com.wealthmap.dto.response.AnalyticsSummaryResponse;
import com.wealthmap.dto.response.WhatIfResponse;
import com.wealthmap.service.AnalyticsService;
import com.wealthmap.service.BenchmarkService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;
    private final BenchmarkService benchmarkService;

    @GetMapping("/summary")
    public ResponseEntity<AnalyticsSummaryResponse> getAnalyticsSummary(Authentication authentication) {
        return ResponseEntity.ok(analyticsService.getAnalyticsSummary(authentication.getName()));
    }

    @GetMapping("/benchmarks")
    public ResponseEntity<List<BenchmarkService.BenchmarkDataPoint>> getBenchmarks(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(benchmarkService.getHistoricalBenchmarks(startDate, endDate));
    }

    @PostMapping("/what-if")
    public ResponseEntity<WhatIfResponse> simulateWhatIfScenario(
            @RequestBody WhatIfRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(analyticsService.getWhatIfScenario(authentication.getName(), request));
    }
}
