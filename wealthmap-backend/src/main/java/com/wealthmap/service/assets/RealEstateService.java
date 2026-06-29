package com.wealthmap.service.assets;

import com.wealthmap.dto.request.RealEstateRequest;
import com.wealthmap.dto.response.AssetResponse;
import com.wealthmap.dto.response.RealEstateResponse;
import com.wealthmap.entity.RealEstate;
import com.wealthmap.entity.User;
import com.wealthmap.repository.AssetRepository;
import com.wealthmap.repository.UserRepository;
import com.wealthmap.service.price.PriceProviderFactory;
import com.wealthmap.enums.AssetType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RealEstateService {

    private final AssetRepository assetRepository;
    private final UserRepository userRepository;
    private final PriceProviderFactory priceProviderFactory;

    public AssetResponse addRealEstate(RealEstateRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        RealEstate re = new RealEstate();
        re.setUser(user);
        re.setFamilyGroup(user.getFamilyGroup());
        re.setName(request.getPropertyName());
        re.setAssetType(AssetType.REAL_ESTATE);
        re.setPurchaseDate(request.getPurchaseDate());
        re.setNotes(request.getNotes());
        
        re.setPropertyName(request.getPropertyName());
        re.setPropertyType(request.getPropertyType());
        re.setPurchasePrice(request.getPurchasePrice());
        re.setEstimatedCurrentValue(request.getEstimatedCurrentValue());

        RealEstate saved = assetRepository.save(re);
        return mapToResponse(saved);
    }

    public RealEstateResponse getRealEstateById(Long id, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        RealEstate re = (RealEstate) assetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Asset not found"));
        if (!re.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Access Denied");
        }
        return mapToResponse(re);
    }

    public RealEstateResponse updateRealEstate(Long id, RealEstateRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        RealEstate re = (RealEstate) assetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Asset not found"));
        if (!re.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Access Denied");
        }

        re.setName(request.getPropertyName());
        re.setPurchaseDate(request.getPurchaseDate());
        re.setNotes(request.getNotes());
        
        re.setPropertyName(request.getPropertyName());
        re.setPropertyType(request.getPropertyType());
        re.setPurchasePrice(request.getPurchasePrice());
        re.setEstimatedCurrentValue(request.getEstimatedCurrentValue());

        RealEstate saved = assetRepository.save(re);
        return mapToResponse(saved);
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<AssetResponse> getAllRealEstateForUser(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return assetRepository.findByUserIdAndAssetType(user.getId(), AssetType.REAL_ESTATE)
                .stream()
                .map(asset -> mapToResponse((RealEstate) asset))
                .collect(Collectors.toList());
    }

    private RealEstateResponse mapToResponse(RealEstate item) {
        RealEstateResponse response = new RealEstateResponse();
        response.setId(item.getId());
        response.setName(item.getName());
        response.setAssetType(item.getAssetType());
        response.setPurchaseDate(item.getPurchaseDate());
        response.setNotes(item.getNotes());
        response.setFamilyMemberId(item.getUser().getId());
        response.setFamilyMemberName(item.getUser().getName());
        response.setInvestedAmount(item.getInvestedAmount());

        response.setPropertyName(item.getPropertyName());
        response.setPropertyType(item.getPropertyType());
        response.setPurchasePrice(item.getPurchasePrice());
        response.setEstimatedCurrentValue(item.getEstimatedCurrentValue());

        BigDecimal currentValue = priceProviderFactory.getProvider(AssetType.REAL_ESTATE).getCurrentPrice(item);
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
}
