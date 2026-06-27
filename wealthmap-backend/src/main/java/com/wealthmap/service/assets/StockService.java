package com.wealthmap.service.assets;

import com.wealthmap.dto.request.StockRequest;
import com.wealthmap.dto.response.AssetResponse;
import com.wealthmap.dto.response.StockResponse;
import com.wealthmap.entity.FamilyMember;
import com.wealthmap.entity.Stock;
import com.wealthmap.entity.User;
import com.wealthmap.repository.AssetRepository;
import com.wealthmap.repository.FamilyMemberRepository;
import com.wealthmap.repository.UserRepository;
import com.wealthmap.service.price.PriceProviderFactory;
import com.wealthmap.enums.AssetType;
import com.wealthmap.enums.RelationType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.web.client.RestTemplate;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.wealthmap.dto.response.StockSearchResponse;

@Service
@RequiredArgsConstructor
public class StockService {

    private final AssetRepository assetRepository;
    private final FamilyMemberRepository familyMemberRepository;
    private final UserRepository userRepository;
    private final PriceProviderFactory priceProviderFactory;

    public AssetResponse addStock(StockRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        FamilyMember familyMember = familyMemberRepository.findByUserId(user.getId())
                .stream()
                .filter(f -> RelationType.SELF.equals(f.getRelationType()))
                .findFirst()
                .orElseGet(() -> {
                    FamilyMember self = new FamilyMember();
                    self.setUser(user);
                    self.setName(user.getName());
                    self.setRelationType(RelationType.SELF);
                    return familyMemberRepository.save(self);
                });

        Stock stock = new Stock();
        stock.setUser(user);
        stock.setFamilyMember(familyMember);
        stock.setName(request.getCompanyName() + " (" + request.getTicker() + ")");
        stock.setAssetType(AssetType.STOCK);
        stock.setPurchaseDate(request.getPurchaseDate());
        stock.setNotes(request.getNotes());
        
        stock.setTicker(request.getTicker());
        stock.setCompanyName(request.getCompanyName());
        stock.setQuantity(request.getQuantity());
        stock.setAverageBuyPrice(request.getAverageBuyPrice());

        Stock saved = assetRepository.save(stock);
        return mapToResponse(saved);
    }

    public StockResponse getStockById(Long id, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Stock stock = (Stock) assetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Asset not found"));
        if (!stock.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Access Denied");
        }
        return mapToResponse(stock);
    }

    public StockResponse updateStock(Long id, StockRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Stock stock = (Stock) assetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Asset not found"));
        if (!stock.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Access Denied");
        }

        stock.setName(request.getCompanyName() + " (" + request.getTicker() + ")");
        stock.setPurchaseDate(request.getPurchaseDate());
        stock.setNotes(request.getNotes());
        
        stock.setTicker(request.getTicker());
        stock.setCompanyName(request.getCompanyName());
        stock.setQuantity(request.getQuantity());
        stock.setAverageBuyPrice(request.getAverageBuyPrice());

        Stock saved = assetRepository.save(stock);
        return mapToResponse(saved);
    }

    public List<AssetResponse> getAllStocksForUser(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return assetRepository.findByUserIdAndAssetType(user.getId(), AssetType.STOCK)
                .stream()
                .map(asset -> mapToResponse((Stock) asset))
                .collect(Collectors.toList());
    }

    private StockResponse mapToResponse(Stock item) {
        StockResponse response = new StockResponse();
        response.setId(item.getId());
        response.setName(item.getName());
        response.setAssetType(item.getAssetType());
        response.setPurchaseDate(item.getPurchaseDate());
        response.setNotes(item.getNotes());
        response.setFamilyMemberId(item.getFamilyMember().getId());
        response.setFamilyMemberName(item.getFamilyMember().getName());
        response.setInvestedAmount(item.getInvestedAmount());

        response.setTicker(item.getTicker());
        response.setCompanyName(item.getCompanyName());
        response.setQuantity(item.getQuantity());
        response.setAverageBuyPrice(item.getAverageBuyPrice());

        BigDecimal currentValue = priceProviderFactory.getProvider(AssetType.STOCK).getCurrentPrice(item);
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

    public List<StockSearchResponse> searchStocks(String query) {
        if (query == null || query.trim().length() < 1) {
            return new ArrayList<>();
        }
        
        List<StockSearchResponse> results = new ArrayList<>();
        try {
            RestTemplate restTemplate = new RestTemplate();
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)");
            org.springframework.http.HttpEntity<String> entity = new org.springframework.http.HttpEntity<>(headers);
            
            String url = "https://query2.finance.yahoo.com/v1/finance/search?q=" + query + "&quotesCount=5&newsCount=0";
            
            org.springframework.http.ResponseEntity<String> response = restTemplate.exchange(
                    url, 
                    org.springframework.http.HttpMethod.GET, 
                    entity, 
                    String.class
            );
            
            String jsonResponse = response.getBody();
            
            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(jsonResponse);
            JsonNode quotes = root.path("quotes");
            
            if (quotes.isArray()) {
                for (JsonNode quote : quotes) {
                    String symbol = quote.path("symbol").asText();
                    String companyName = quote.path("shortname").asText();
                    if (companyName == null || companyName.isEmpty()) {
                        companyName = quote.path("longname").asText();
                    }
                    String exchange = quote.path("exchDisp").asText();
                    
                    if (symbol != null && !symbol.isEmpty()) {
                        results.add(new StockSearchResponse(symbol, companyName, exchange));
                    }
                }
            }
        } catch (Exception e) {
            // Log error, return empty list on failure
            System.err.println("Failed to fetch stock search results: " + e.getMessage());
        }
        
        return results;
    }
}
