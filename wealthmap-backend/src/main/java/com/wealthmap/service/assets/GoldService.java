package com.wealthmap.service.assets;

import com.wealthmap.dto.request.GoldRequest;
import com.wealthmap.dto.response.AssetResponse;
import com.wealthmap.dto.response.GoldResponse;
import com.wealthmap.entity.GoldItem;
import com.wealthmap.entity.User;
import com.wealthmap.repository.AssetRepository;
import com.wealthmap.repository.UserRepository;
import com.wealthmap.service.price.PriceProviderFactory;
import com.wealthmap.enums.AssetType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GoldService {

    private final AssetRepository assetRepository;
    private final UserRepository userRepository;
    private final PriceProviderFactory priceProviderFactory;
    private final com.wealthmap.service.CurrencyConversionService currencyConversionService;

    public AssetResponse addGold(GoldRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        GoldItem goldItem = new GoldItem();
        goldItem.setUser(user);
        goldItem.setFamilyGroup(user.getFamilyGroup());
        goldItem.setName(request.getName());
        goldItem.setPurchaseDate(request.getPurchaseDate());
        goldItem.setNotes(request.getNotes());
        goldItem.setNomineeName(request.getNomineeName());
        goldItem.setNomineeRelationship(request.getNomineeRelationship());
        goldItem.setAssetType(AssetType.GOLD);
        goldItem.setCurrency(request.getCurrency() != null && !request.getCurrency().trim().isEmpty() ? request.getCurrency().toUpperCase() : "INR");
        
        goldItem.setWeightGrams(request.getWeightGrams());
        goldItem.setPurity(request.getPurity());
        goldItem.setPurchasePrice(request.getPurchasePrice());

        GoldItem saved = assetRepository.save(goldItem);
        return mapToResponse(saved);
    }

    public GoldResponse getGoldById(Long id, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        GoldItem goldItem = (GoldItem) assetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Asset not found"));
        if (!goldItem.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Access Denied");
        }
        return mapToResponse(goldItem);
    }

    public GoldResponse updateGold(Long id, GoldRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        GoldItem goldItem = (GoldItem) assetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Asset not found"));
        if (!goldItem.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Access Denied");
        }

        goldItem.setName(request.getName());
        goldItem.setPurchaseDate(request.getPurchaseDate());
        goldItem.setNotes(request.getNotes());
        goldItem.setNomineeName(request.getNomineeName());
        goldItem.setNomineeRelationship(request.getNomineeRelationship());
        goldItem.setCurrency(request.getCurrency() != null && !request.getCurrency().trim().isEmpty() ? request.getCurrency().toUpperCase() : "INR");
        goldItem.setWeightGrams(request.getWeightGrams());
        goldItem.setPurity(request.getPurity());
        goldItem.setPurchasePrice(request.getPurchasePrice());

        GoldItem saved = assetRepository.save(goldItem);
        return mapToResponse(saved);
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<AssetResponse> getAllGoldForUser(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return assetRepository.findByUserIdAndAssetType(user.getId(), AssetType.GOLD)
                .stream()
                .map(asset -> mapToResponse((GoldItem) asset))
                .collect(Collectors.toList());
    }

    private GoldResponse mapToResponse(GoldItem item) {
        GoldResponse response = new GoldResponse();
        response.setId(item.getId());
        response.setName(item.getName());
        response.setAssetType(item.getAssetType());
        response.setPurchaseDate(item.getPurchaseDate());
        response.setNotes(item.getNotes());
        response.setNomineeName(item.getNomineeName());
        response.setNomineeRelationship(item.getNomineeRelationship());
        response.setFamilyMemberId(item.getUser().getId());
        response.setFamilyMemberName(item.getUser().getName());

        String currency = item.getCurrency() != null ? item.getCurrency().toUpperCase() : "INR";
        response.setCurrency(currency);

        BigDecimal originalInvested = item.getInvestedAmount();
        response.setOriginalInvestedAmount(originalInvested);

        response.setWeightInGrams(item.getWeightGrams());
        response.setPurity(item.getPurity());
        response.setPurchasePrice(item.getPurchasePrice());

        BigDecimal originalCurrentValue = priceProviderFactory.getProvider(AssetType.GOLD).getCurrentPrice(item);
        response.setOriginalCurrentValue(originalCurrentValue);

        BigDecimal exchangeRate = currencyConversionService.getExchangeRate(currency, "INR");
        response.setExchangeRate(exchangeRate);

        BigDecimal convertedInvested = originalInvested.multiply(exchangeRate).setScale(2, java.math.RoundingMode.HALF_UP);
        BigDecimal convertedCurrentValue = originalCurrentValue.multiply(exchangeRate).setScale(2, java.math.RoundingMode.HALF_UP);

        response.setInvestedAmount(convertedInvested);
        response.setCurrentValue(convertedCurrentValue);

        BigDecimal gainLoss = convertedCurrentValue.subtract(convertedInvested);
        response.setGainLoss(gainLoss);

        BigDecimal gainPercent = BigDecimal.ZERO;
        if (convertedInvested.compareTo(BigDecimal.ZERO) > 0) {
            gainPercent = gainLoss.divide(convertedInvested, 4, java.math.RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));
        }
        response.setGainPercent(gainPercent);

        return response;
    }
}
