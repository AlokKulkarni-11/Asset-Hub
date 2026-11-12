package com.wealthmap.controller;

import com.wealthmap.dto.response.AssetResponse;
import com.wealthmap.repository.AssetRepository;
import com.wealthmap.repository.UserRepository;
import com.wealthmap.entity.User;
import com.wealthmap.entity.base.Asset;
import com.wealthmap.service.assets.FixedDepositService;
import com.wealthmap.service.assets.GoldService;
import com.wealthmap.service.assets.SilverService;
import com.wealthmap.service.assets.StockService;
import com.wealthmap.service.assets.MutualFundService;
import com.wealthmap.service.assets.RealEstateService;
import com.wealthmap.service.assets.CryptoService;
import com.wealthmap.dto.request.MutualFundRequest;
import com.wealthmap.dto.request.RealEstateRequest;
import com.wealthmap.dto.request.CryptoRequest;
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
    private final SilverService silverService;
    private final FixedDepositService fdService;
    private final StockService stockService;
    private final MutualFundService mfService;
    private final RealEstateService reService;
    private final CryptoService cryptoService;
    private final com.wealthmap.service.assets.BondService bondService;
    private final com.wealthmap.service.assets.EsopRsuService esopRsuService;
    private final AssetRepository assetRepository;
    private final UserRepository userRepository;
    private final com.wealthmap.service.AuditLogService auditLogService;
    private final com.wealthmap.service.price.GoldPriceProvider goldPriceProvider;
    private final com.wealthmap.service.price.SilverPriceProvider silverPriceProvider;

    @GetMapping
    public ResponseEntity<List<AssetResponse>> getAllAssets(Authentication authentication) {
        String userEmail = authentication.getName();
        
        List<AssetResponse> allAssets = new ArrayList<>();
        allAssets.addAll(goldService.getAllGoldForUser(userEmail));
        allAssets.addAll(silverService.getAllSilverForUser(userEmail));
        allAssets.addAll(fdService.getAllFDsForUser(userEmail));
        allAssets.addAll(stockService.getAllStocksForUser(userEmail));
        allAssets.addAll(mfService.getAllMutualFundsForUser(userEmail));
        allAssets.addAll(reService.getAllRealEstateForUser(userEmail));
        allAssets.addAll(cryptoService.getAllCryptoForUser(userEmail));
        allAssets.addAll(bondService.getAllBondsForUser(userEmail));
        allAssets.addAll(esopRsuService.getAllEsopRsusForUser(userEmail));
        
        return ResponseEntity.ok(allAssets);
    }

    @GetMapping("/metals/rates")
    public ResponseEntity<java.util.Map<String, Object>> getLiveIndianMetalRates() {
        java.math.BigDecimal gold24k = goldPriceProvider.getCurrentGoldPrice();
        java.math.BigDecimal gold22k = gold24k.multiply(java.math.BigDecimal.valueOf(22.0 / 24.0))
                .setScale(2, java.math.RoundingMode.HALF_UP);
        java.math.BigDecimal silver999 = silverPriceProvider.getCurrentSilverPrice();

        return ResponseEntity.ok(java.util.Map.of(
                "gold24kPerGram", gold24k,
                "gold22kPerGram", gold22k,
                "silverPerGram", silver999,
                "currency", "INR",
                "source", "IBJA (India Bullion & Jewellers Association)"
        ));
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
        AssetResponse response = mfService.addMutualFund(request, authentication.getName());
        auditLogService.log(authentication.getName(), "ADD_ASSET", "MUTUAL_FUND", response.getId(), "Added mutual fund: " + request.getSchemeName());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/mutualfund/{id}")
    public ResponseEntity<AssetResponse> updateMutualFund(@PathVariable Long id, @RequestBody MutualFundRequest request, Authentication authentication) {
        AssetResponse response = mfService.updateMutualFund(id, request, authentication.getName());
        auditLogService.log(authentication.getName(), "UPDATE_ASSET", "MUTUAL_FUND", response.getId(), "Updated mutual fund: " + request.getSchemeName());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/realestate/{id}")
    public ResponseEntity<AssetResponse> getRealEstateById(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(reService.getRealEstateById(id, authentication.getName()));
    }

    @PostMapping("/realestate")
    public ResponseEntity<AssetResponse> addRealEstate(@RequestBody RealEstateRequest request, Authentication authentication) {
        AssetResponse response = reService.addRealEstate(request, authentication.getName());
        auditLogService.log(authentication.getName(), "ADD_ASSET", "REAL_ESTATE", response.getId(), "Added real estate: " + request.getPropertyName());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/realestate/{id}")
    public ResponseEntity<AssetResponse> updateRealEstate(@PathVariable Long id, @RequestBody RealEstateRequest request, Authentication authentication) {
        AssetResponse response = reService.updateRealEstate(id, request, authentication.getName());
        auditLogService.log(authentication.getName(), "UPDATE_ASSET", "REAL_ESTATE", response.getId(), "Updated real estate: " + request.getPropertyName());
        return ResponseEntity.ok(response);
    }

    // Crypto Endpoints
    @GetMapping("/crypto/search")
    public ResponseEntity<Object> searchCrypto(@RequestParam String q) {
        return ResponseEntity.ok(cryptoService.searchCrypto(q));
    }

    @GetMapping("/crypto/{id}")
    public ResponseEntity<AssetResponse> getCryptoById(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(cryptoService.getCryptoById(id, authentication.getName()));
    }

    @PostMapping("/crypto")
    public ResponseEntity<AssetResponse> addCrypto(@RequestBody CryptoRequest request, Authentication authentication) {
        AssetResponse response = cryptoService.addCrypto(request, authentication.getName());
        auditLogService.log(authentication.getName(), "ADD_ASSET", "CRYPTO", response.getId(), "Added crypto: " + request.getName());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/crypto/{id}")
    public ResponseEntity<AssetResponse> updateCrypto(@PathVariable Long id, @RequestBody CryptoRequest request, Authentication authentication) {
        AssetResponse response = cryptoService.updateCrypto(id, request, authentication.getName());
        auditLogService.log(authentication.getName(), "UPDATE_ASSET", "CRYPTO", response.getId(), "Updated crypto: " + request.getName());
        return ResponseEntity.ok(response);
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
        auditLogService.log(userEmail, "DELETE_ASSET", asset.getAssetType().name(), asset.getId(), "Deleted asset: " + asset.getName());
        return ResponseEntity.ok().build();
    }
}
