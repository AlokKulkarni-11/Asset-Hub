package com.wealthmap.service.assets;

import com.wealthmap.dto.request.SilverRequest;
import com.wealthmap.dto.response.AssetResponse;
import com.wealthmap.dto.response.SilverResponse;
import com.wealthmap.entity.SilverItem;
import com.wealthmap.entity.User;
import com.wealthmap.enums.AssetType;
import com.wealthmap.repository.AssetRepository;
import com.wealthmap.repository.UserRepository;
import com.wealthmap.service.price.PriceProviderFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SilverService {

    private final AssetRepository assetRepository;
    private final UserRepository userRepository;
    private final PriceProviderFactory priceProviderFactory;
    private final com.wealthmap.service.CurrencyConversionService currencyConversionService;

    public AssetResponse addSilver(SilverRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        SilverItem silverItem = new SilverItem();
        silverItem.setUser(user);
        silverItem.setFamilyGroup(user.getFamilyGroup());
        silverItem.setName(request.getName());
        silverItem.setPurchaseDate(request.getPurchaseDate());
        silverItem.setNotes(request.getNotes());
        silverItem.setNomineeName(request.getNomineeName());
        silverItem.setNomineeRelationship(request.getNomineeRelationship());
        silverItem.setAssetType(AssetType.SILVER);
        silverItem.setCurrency(request.getCurrency() != null && !request.getCurrency().trim().isEmpty() ? request.getCurrency().toUpperCase() : "INR");

        silverItem.setWeightGrams(request.getWeightGrams());
        silverItem.setPurity(request.getPurity());
        silverItem.setPurchasePrice(request.getPurchasePrice());

        SilverItem saved = assetRepository.save(silverItem);
        return mapToResponse(saved);
    }

    public SilverResponse getSilverById(Long id, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        SilverItem silverItem = (SilverItem) assetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Asset not found"));
        if (!silverItem.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Access Denied");
        }
        return mapToResponse(silverItem);
    }

    public SilverResponse updateSilver(Long id, SilverRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        SilverItem silverItem = (SilverItem) assetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Asset not found"));
        if (!silverItem.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Access Denied");
        }

        silverItem.setName(request.getName());
        silverItem.setPurchaseDate(request.getPurchaseDate());
        silverItem.setNotes(request.getNotes());
        silverItem.setNomineeName(request.getNomineeName());
        silverItem.setNomineeRelationship(request.getNomineeRelationship());
        silverItem.setCurrency(request.getCurrency() != null && !request.getCurrency().trim().isEmpty() ? request.getCurrency().toUpperCase() : "INR");
        silverItem.setWeightGrams(request.getWeightGrams());
        silverItem.setPurity(request.getPurity());
        silverItem.setPurchasePrice(request.getPurchasePrice());

        SilverItem saved = assetRepository.save(silverItem);
        return mapToResponse(saved);
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<AssetResponse> getAllSilverForUser(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return assetRepository.findByUserIdAndAssetType(user.getId(), AssetType.SILVER)
                .stream()
                .map(asset -> mapToResponse((SilverItem) asset))
                .collect(Collectors.toList());
    }

    private SilverResponse mapToResponse(SilverItem item) {
        SilverResponse response = new SilverResponse();
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

        BigDecimal originalCurrentValue = priceProviderFactory.getProvider(AssetType.SILVER).getCurrentPrice(item);
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
