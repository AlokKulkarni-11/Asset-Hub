package com.wealthmap.controller;

import com.wealthmap.dto.request.StockRequest;
import com.wealthmap.dto.response.AssetResponse;
import com.wealthmap.dto.response.StockResponse;
import com.wealthmap.dto.response.StockSearchResponse;
import com.wealthmap.service.assets.StockService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/assets/stock")
@RequiredArgsConstructor
public class MarketController {

    private final StockService stockService;
    private final com.wealthmap.service.AuditLogService auditLogService;

    @PostMapping
    public ResponseEntity<AssetResponse> addStock(
            @Valid @RequestBody StockRequest request,
            Authentication authentication) {
        
        String userEmail = authentication.getName();
        AssetResponse response = stockService.addStock(request, userEmail);
        auditLogService.log(userEmail, "ADD_ASSET", "STOCK", response.getId(), "Added stock asset: " + request.getQuantity() + " shares of " + request.getTicker());
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<AssetResponse>> getAllStocks(Authentication authentication) {
        String userEmail = authentication.getName();
        List<AssetResponse> response = stockService.getAllStocksForUser(userEmail);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/search")
    public ResponseEntity<List<StockSearchResponse>> searchStocks(@RequestParam String query) {
        List<StockSearchResponse> response = stockService.searchStocks(query);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<StockResponse> getStock(@PathVariable Long id, Authentication authentication) {
        String userEmail = authentication.getName();
        StockResponse response = stockService.getStockById(id, userEmail);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<StockResponse> updateStock(
            @PathVariable Long id,
            @Valid @RequestBody StockRequest request,
            Authentication authentication) {
        String userEmail = authentication.getName();
        StockResponse response = stockService.updateStock(id, request, userEmail);
        auditLogService.log(userEmail, "UPDATE_ASSET", "STOCK", response.getId(), "Updated stock asset quantity to " + request.getQuantity() + " shares of " + request.getTicker());
        return ResponseEntity.ok(response);
    }
}
