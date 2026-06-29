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

    public AssetResponse addGold(GoldRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        GoldItem goldItem = new GoldItem();
        goldItem.setUser(user);
        goldItem.setFamilyGroup(user.getFamilyGroup());
        goldItem.setName(request.getName());
        goldItem.setPurchaseDate(request.getPurchaseDate());
        goldItem.setNotes(request.getNotes());
        goldItem.setAssetType(AssetType.GOLD);
        
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
        response.setFamilyMemberId(item.getUser().getId());
        response.setFamilyMemberName(item.getUser().getName());
        response.setInvestedAmount(item.getInvestedAmount());

        response.setWeightInGrams(item.getWeightGrams());
        response.setPurity(item.getPurity());
        response.setPurchasePrice(item.getPurchasePrice());

        BigDecimal currentValue = priceProviderFactory.getProvider(AssetType.GOLD).getCurrentPrice(item);
        response.setCurrentValue(currentValue);

        BigDecimal gainLoss = currentValue.subtract(item.getInvestedAmount());
        response.setGainLoss(gainLoss);

        BigDecimal gainPercent = BigDecimal.ZERO;
        if (item.getInvestedAmount().compareTo(BigDecimal.ZERO) > 0) {
            gainPercent = gainLoss.divide(item.getInvestedAmount(), 4, java.math.RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));
        }
        response.setGainPercent(gainPercent);

        return response;
    }
}
