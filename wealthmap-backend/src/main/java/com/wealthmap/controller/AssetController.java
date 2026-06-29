package com.wealthmap.controller;

import com.wealthmap.dto.response.AssetResponse;
import com.wealthmap.repository.AssetRepository;
import com.wealthmap.repository.UserRepository;
import com.wealthmap.entity.User;
import com.wealthmap.entity.base.Asset;
import com.wealthmap.service.assets.FixedDepositService;
import com.wealthmap.service.assets.GoldService;
import com.wealthmap.service.assets.StockService;
import com.wealthmap.service.assets.MutualFundService;
import com.wealthmap.service.assets.RealEstateService;
import com.wealthmap.dto.request.MutualFundRequest;
import com.wealthmap.dto.request.RealEstateRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/assets")
@RequiredArgsConstructor
public class AssetController {

    private final GoldService goldService;
    private final FixedDepositService fdService;
    private final StockService stockService;
    private final MutualFundService mfService;
    private final RealEstateService reService;
    private final AssetRepository assetRepository;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<AssetResponse>> getAllAssets(Authentication authentication) {
        String userEmail = authentication.getName();
        
        List<AssetResponse> allAssets = new ArrayList<>();
        allAssets.addAll(goldService.getAllGoldForUser(userEmail));
        allAssets.addAll(fdService.getAllFDsForUser(userEmail));
        allAssets.addAll(stockService.getAllStocksForUser(userEmail));
        allAssets.addAll(mfService.getAllMutualFundsForUser(userEmail));
        allAssets.addAll(reService.getAllRealEstateForUser(userEmail));
        
        return ResponseEntity.ok(allAssets);
    }

    @GetMapping("/mutualfund/search")
    public ResponseEntity<Object> searchMutualFunds(@RequestParam String q) {
        return ResponseEntity.ok(mfService.searchMutualFunds(q));
    }

    @GetMapping("/mutualfund/{id}")
    public ResponseEntity<AssetResponse> getMutualFundById(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(mfService.getMutualFundById(id, authentication.getName()));
    }

    @PostMapping("/mutualfund")
    public ResponseEntity<AssetResponse> addMutualFund(@RequestBody MutualFundRequest request, Authentication authentication) {
        return ResponseEntity.ok(mfService.addMutualFund(request, authentication.getName()));
    }

    @PutMapping("/mutualfund/{id}")
    public ResponseEntity<AssetResponse> updateMutualFund(@PathVariable Long id, @RequestBody MutualFundRequest request, Authentication authentication) {
        return ResponseEntity.ok(mfService.updateMutualFund(id, request, authentication.getName()));
    }

    @GetMapping("/realestate/{id}")
    public ResponseEntity<AssetResponse> getRealEstateById(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(reService.getRealEstateById(id, authentication.getName()));
    }

    @PostMapping("/realestate")
    public ResponseEntity<AssetResponse> addRealEstate(@RequestBody RealEstateRequest request, Authentication authentication) {
        return ResponseEntity.ok(reService.addRealEstate(request, authentication.getName()));
    }

    @PutMapping("/realestate/{id}")
    public ResponseEntity<AssetResponse> updateRealEstate(@PathVariable Long id, @RequestBody RealEstateRequest request, Authentication authentication) {
        return ResponseEntity.ok(reService.updateRealEstate(id, request, authentication.getName()));
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
