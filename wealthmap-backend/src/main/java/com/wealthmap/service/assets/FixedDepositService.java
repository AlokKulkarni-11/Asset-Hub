package com.wealthmap.service.assets;

import com.wealthmap.dto.request.FixedDepositRequest;
import com.wealthmap.dto.response.AssetResponse;
import com.wealthmap.dto.response.FixedDepositResponse;
import com.wealthmap.entity.FamilyMember;
import com.wealthmap.entity.FixedDeposit;
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
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FixedDepositService {

    private final AssetRepository assetRepository;
    private final FamilyMemberRepository familyMemberRepository;
    private final UserRepository userRepository;
    private final PriceProviderFactory priceProviderFactory;

    public AssetResponse addFD(FixedDepositRequest request, String userEmail) {
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

        FixedDeposit fd = new FixedDeposit();
        fd.setUser(user);
        fd.setFamilyMember(familyMember);
        fd.setName(request.getName());
        fd.setAssetType(AssetType.FIXED_DEPOSIT);
        fd.setPurchaseDate(request.getStartDate());
        fd.setNotes(request.getNotes());
        
        fd.setBankName(request.getBankName());
        fd.setStartDate(request.getStartDate());
        fd.setMaturityDate(request.getMaturityDate());
        fd.setPrincipalAmount(request.getPrincipalAmount());
        fd.setInterestRate(request.getInterestRate());
        fd.setCompoundingFrequency(request.getCompoundingFrequency());

        FixedDeposit saved = assetRepository.save(fd);
        return mapToResponse(saved);
    }

    public FixedDepositResponse getFDById(Long id, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        FixedDeposit fd = (FixedDeposit) assetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Asset not found"));
        if (!fd.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Access Denied");
        }
        return mapToResponse(fd);
    }

    public FixedDepositResponse updateFD(Long id, FixedDepositRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        FixedDeposit fd = (FixedDeposit) assetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Asset not found"));
        if (!fd.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Access Denied");
        }

        fd.setName(request.getName());
        fd.setPurchaseDate(request.getStartDate());
        fd.setNotes(request.getNotes());
        
        fd.setBankName(request.getBankName());
        fd.setStartDate(request.getStartDate());
        fd.setMaturityDate(request.getMaturityDate());
        fd.setPrincipalAmount(request.getPrincipalAmount());
        fd.setInterestRate(request.getInterestRate());
        fd.setCompoundingFrequency(request.getCompoundingFrequency());

        FixedDeposit saved = assetRepository.save(fd);
        return mapToResponse(saved);
    }

    public List<AssetResponse> getAllFDsForUser(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return assetRepository.findByUserIdAndAssetType(user.getId(), AssetType.FIXED_DEPOSIT)
                .stream()
                .map(asset -> mapToResponse((FixedDeposit) asset))
                .collect(Collectors.toList());
    }

    private FixedDepositResponse mapToResponse(FixedDeposit item) {
        FixedDepositResponse response = new FixedDepositResponse();
        response.setId(item.getId());
        response.setName(item.getName());
        response.setAssetType(item.getAssetType());
        response.setPurchaseDate(item.getPurchaseDate());
        response.setNotes(item.getNotes());
        response.setFamilyMemberId(item.getFamilyMember().getId());
        response.setFamilyMemberName(item.getFamilyMember().getName());
        response.setInvestedAmount(item.getPrincipalAmount());

        response.setBankName(item.getBankName());
        response.setStartDate(item.getStartDate());
        response.setMaturityDate(item.getMaturityDate());
        response.setPrincipalAmount(item.getPrincipalAmount());
        response.setInterestRate(item.getInterestRate());
        response.setCompoundingFrequency(item.getCompoundingFrequency());

        BigDecimal currentValue = priceProviderFactory.getProvider(AssetType.FIXED_DEPOSIT).getCurrentPrice(item);
        response.setCurrentValue(currentValue);

        BigDecimal gainLoss = currentValue.subtract(item.getPrincipalAmount());
        response.setGainLoss(gainLoss);

        BigDecimal gainPercent = BigDecimal.ZERO;
        if (item.getPrincipalAmount().compareTo(BigDecimal.ZERO) > 0) {
            gainPercent = gainLoss.divide(item.getPrincipalAmount(), 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));
        }
        response.setGainPercent(gainPercent);

        return response;
    }
}
