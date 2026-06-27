package com.wealthmap.controller;

import com.wealthmap.dto.response.AssetResponse;
import com.wealthmap.repository.AssetRepository;
import com.wealthmap.repository.UserRepository;
import com.wealthmap.entity.User;
import com.wealthmap.entity.base.Asset;
import com.wealthmap.service.assets.FixedDepositService;
import com.wealthmap.service.assets.GoldService;
import com.wealthmap.service.assets.StockService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/assets")
@RequiredArgsConstructor
public class AssetController {

    private final GoldService goldService;
    private final FixedDepositService fdService;
    private final StockService stockService;
    private final AssetRepository assetRepository;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<AssetResponse>> getAllAssets(Authentication authentication) {
        String userEmail = authentication.getName();
        
        List<AssetResponse> allAssets = new ArrayList<>();
        allAssets.addAll(goldService.getAllGoldForUser(userEmail));
        allAssets.addAll(fdService.getAllFDsForUser(userEmail));
        allAssets.addAll(stockService.getAllStocksForUser(userEmail));
        
        return ResponseEntity.ok(allAssets);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAsset(@PathVariable Long id, Authentication authentication) {
        String userEmail = authentication.getName();
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Asset asset = assetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Asset not found"));
        if (!asset.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Access Denied");
        }
        assetRepository.delete(asset);
        return ResponseEntity.ok().build();
    }
}
