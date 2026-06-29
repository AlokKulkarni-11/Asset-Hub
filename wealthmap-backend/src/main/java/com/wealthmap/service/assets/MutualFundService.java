package com.wealthmap.service.assets;

import com.wealthmap.dto.request.MutualFundRequest;
import com.wealthmap.dto.response.AssetResponse;
import com.wealthmap.dto.response.MutualFundResponse;
import com.wealthmap.entity.MutualFund;
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
import org.springframework.web.client.RestTemplate;

@Service
@RequiredArgsConstructor
public class MutualFundService {

    private final AssetRepository assetRepository;
    private final UserRepository userRepository;
    private final PriceProviderFactory priceProviderFactory;
    private final RestTemplate restTemplate = new RestTemplate();

    public Object searchMutualFunds(String query) {
        String url = "https://api.mfapi.in/mf/search?q=" + query;
        return restTemplate.getForObject(url, Object.class);
    }

    public AssetResponse addMutualFund(MutualFundRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        MutualFund mf = new MutualFund();
        mf.setUser(user);
        mf.setFamilyGroup(user.getFamilyGroup());
        mf.setName(request.getSchemeName());
        mf.setAssetType(AssetType.MUTUAL_FUND);
        mf.setPurchaseDate(request.getPurchaseDate());
        mf.setNotes(request.getNotes());
        
        mf.setSchemeCode(request.getSchemeCode());
        mf.setSchemeName(request.getSchemeName());
        mf.setFolioNumber(request.getFolioNumber());
        mf.setUnits(request.getUnits());
        mf.setAverageNav(request.getAverageNav());

        MutualFund saved = assetRepository.save(mf);
        return mapToResponse(saved);
    }

    public MutualFundResponse getMutualFundById(Long id, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        MutualFund mf = (MutualFund) assetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Asset not found"));
        if (!mf.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Access Denied");
        }
        return mapToResponse(mf);
    }

    public MutualFundResponse updateMutualFund(Long id, MutualFundRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        MutualFund mf = (MutualFund) assetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Asset not found"));
        if (!mf.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Access Denied");
        }

        mf.setName(request.getSchemeName());
        mf.setPurchaseDate(request.getPurchaseDate());
        mf.setNotes(request.getNotes());
        
        mf.setSchemeCode(request.getSchemeCode());
        mf.setSchemeName(request.getSchemeName());
        mf.setFolioNumber(request.getFolioNumber());
        mf.setUnits(request.getUnits());
        mf.setAverageNav(request.getAverageNav());

        MutualFund saved = assetRepository.save(mf);
        return mapToResponse(saved);
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<AssetResponse> getAllMutualFundsForUser(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return assetRepository.findByUserIdAndAssetType(user.getId(), AssetType.MUTUAL_FUND)
                .stream()
                .map(asset -> mapToResponse((MutualFund) asset))
                .collect(Collectors.toList());
    }

    private MutualFundResponse mapToResponse(MutualFund item) {
        MutualFundResponse response = new MutualFundResponse();
        response.setId(item.getId());
        response.setName(item.getName());
        response.setAssetType(item.getAssetType());
        response.setPurchaseDate(item.getPurchaseDate());
        response.setNotes(item.getNotes());
        response.setFamilyMemberId(item.getUser().getId());
        response.setFamilyMemberName(item.getUser().getName());
        response.setInvestedAmount(item.getInvestedAmount());

        response.setSchemeCode(item.getSchemeCode());
        response.setSchemeName(item.getSchemeName());
        response.setFolioNumber(item.getFolioNumber());
        response.setUnits(item.getUnits());
        response.setAverageNav(item.getAverageNav());

        BigDecimal currentValue = priceProviderFactory.getProvider(AssetType.MUTUAL_FUND).getCurrentPrice(item);
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
