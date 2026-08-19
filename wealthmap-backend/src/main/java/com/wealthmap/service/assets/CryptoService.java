package com.wealthmap.service.assets;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.wealthmap.dto.request.CryptoRequest;
import com.wealthmap.dto.response.AssetResponse;
import com.wealthmap.dto.response.CryptoResponse;
import com.wealthmap.dto.response.CryptoSearchResponse;
import com.wealthmap.entity.Cryptocurrency;
import com.wealthmap.entity.User;
import com.wealthmap.repository.AssetRepository;
import com.wealthmap.repository.UserRepository;
import com.wealthmap.service.price.PriceProviderFactory;
import com.wealthmap.enums.AssetType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CryptoService {

    private final AssetRepository assetRepository;
    private final UserRepository userRepository;
    private final PriceProviderFactory priceProviderFactory;

    @Transactional
    public AssetResponse addCrypto(CryptoRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Cryptocurrency crypto = new Cryptocurrency();
        crypto.setUser(user);
        crypto.setFamilyGroup(user.getFamilyGroup());
        crypto.setName(request.getName() + " (" + request.getSymbol().toUpperCase() + ")");
        crypto.setAssetType(AssetType.CRYPTOCURRENCY);
        crypto.setPurchaseDate(request.getPurchaseDate());
        crypto.setNotes(request.getNotes());
        
        crypto.setCoinId(request.getCoinId());
        crypto.setSymbol(request.getSymbol());
        crypto.setUnits(request.getUnits());
        crypto.setAverageBuyPrice(request.getAverageBuyPrice());

        Cryptocurrency saved = assetRepository.save(crypto);
        return mapToResponse(saved);
    }

    @Transactional
    public CryptoResponse updateCrypto(Long id, CryptoRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Cryptocurrency crypto = (Cryptocurrency) assetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Asset not found"));
        if (!crypto.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Access Denied");
        }

        crypto.setName(request.getName() + " (" + request.getSymbol().toUpperCase() + ")");
        crypto.setPurchaseDate(request.getPurchaseDate());
        crypto.setNotes(request.getNotes());
        
        crypto.setCoinId(request.getCoinId());
        crypto.setSymbol(request.getSymbol());
        crypto.setUnits(request.getUnits());
        crypto.setAverageBuyPrice(request.getAverageBuyPrice());

        Cryptocurrency saved = assetRepository.save(crypto);
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public CryptoResponse getCryptoById(Long id, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Cryptocurrency crypto = (Cryptocurrency) assetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Asset not found"));
        if (!crypto.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Access Denied");
        }
        return mapToResponse(crypto);
    }

    @Transactional(readOnly = true)
    public List<AssetResponse> getAllCryptoForUser(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return assetRepository.findByUserIdAndAssetType(user.getId(), AssetType.CRYPTOCURRENCY)
                .stream()
                .map(asset -> mapToResponse((Cryptocurrency) asset))
                .collect(Collectors.toList());
    }

    private CryptoResponse mapToResponse(Cryptocurrency item) {
        CryptoResponse response = new CryptoResponse();
        response.setId(item.getId());
        response.setName(item.getName());
        response.setAssetType(item.getAssetType());
        response.setPurchaseDate(item.getPurchaseDate());
        response.setNotes(item.getNotes());
        response.setFamilyMemberId(item.getUser().getId());
        response.setFamilyMemberName(item.getUser().getName());
        response.setInvestedAmount(item.getInvestedAmount());

        response.setCoinId(item.getCoinId());
        response.setSymbol(item.getSymbol());
        response.setUnits(item.getUnits());
        response.setAverageBuyPrice(item.getAverageBuyPrice());

        BigDecimal currentValue = priceProviderFactory.getProvider(AssetType.CRYPTOCURRENCY).getCurrentPrice(item);
        response.setCurrentValue(currentValue);

        BigDecimal gainLoss = currentValue.subtract(item.getInvestedAmount());
        response.setGainLoss(gainLoss);

        BigDecimal gainPercent = BigDecimal.ZERO;
        if (item.getInvestedAmount().compareTo(BigDecimal.ZERO) > 0) {
            gainPercent = gainLoss.divide(item.getInvestedAmount(), 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));
        }
        response.setGainPercent(gainPercent);

        return response;
    }

    public List<CryptoSearchResponse> searchCrypto(String query) {
        if (query == null || query.trim().length() < 1) {
            return new ArrayList<>();
        }
        
        List<CryptoSearchResponse> results = new ArrayList<>();
        try {
            RestTemplate restTemplate = new RestTemplate();
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.set("User-Agent", "Mozilla/5.0");
            org.springframework.http.HttpEntity<String> entity = new org.springframework.http.HttpEntity<>(headers);
            
            String url = "https://api.coingecko.com/api/v3/search?query=" + query;
            String jsonResponse = restTemplate.exchange(url, org.springframework.http.HttpMethod.GET, entity, String.class).getBody();
            
            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(jsonResponse);
            JsonNode coins = root.path("coins");
            
            if (coins.isArray()) {
                int count = 0;
                for (JsonNode coin : coins) {
                    if (count >= 10) break; // Limit search results to 10
                    String id = coin.path("id").asText();
                    String name = coin.path("name").asText();
                    String symbol = coin.path("symbol").asText();
                    
                    if (id != null && !id.isEmpty()) {
                        results.add(new CryptoSearchResponse(id, name, symbol));
                        count++;
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Failed to fetch crypto search results: " + e.getMessage());
        }
        return results;
    }
}
