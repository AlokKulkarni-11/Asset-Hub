package com.wealthmap.service.assets;

import com.wealthmap.dto.request.FixedDepositRequest;
import com.wealthmap.dto.response.AssetResponse;
import com.wealthmap.dto.response.FixedDepositResponse;
import com.wealthmap.entity.FixedDeposit;
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
public class FixedDepositService {

    private final AssetRepository assetRepository;
    private final UserRepository userRepository;
    private final PriceProviderFactory priceProviderFactory;
    private final com.wealthmap.service.CurrencyConversionService currencyConversionService;

    public AssetResponse addFD(FixedDepositRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        FixedDeposit fd = new FixedDeposit();
        fd.setUser(user);
        fd.setFamilyGroup(user.getFamilyGroup());
        fd.setName(request.getName());
        fd.setAssetType(AssetType.FIXED_DEPOSIT);
        fd.setPurchaseDate(request.getStartDate());
        fd.setNotes(request.getNotes());
        fd.setNomineeName(request.getNomineeName());
        fd.setNomineeRelationship(request.getNomineeRelationship());
        fd.setCurrency(request.getCurrency() != null && !request.getCurrency().trim().isEmpty() ? request.getCurrency().toUpperCase() : "INR");
        
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
        fd.setNomineeName(request.getNomineeName());
        fd.setNomineeRelationship(request.getNomineeRelationship());
        fd.setCurrency(request.getCurrency() != null && !request.getCurrency().trim().isEmpty() ? request.getCurrency().toUpperCase() : "INR");
        
        fd.setBankName(request.getBankName());
        fd.setStartDate(request.getStartDate());
        fd.setMaturityDate(request.getMaturityDate());
        fd.setPrincipalAmount(request.getPrincipalAmount());
        fd.setInterestRate(request.getInterestRate());
        fd.setCompoundingFrequency(request.getCompoundingFrequency());

        FixedDeposit saved = assetRepository.save(fd);
        return mapToResponse(saved);
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
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
        response.setNomineeName(item.getNomineeName());
        response.setNomineeRelationship(item.getNomineeRelationship());
        response.setFamilyMemberId(item.getUser().getId());
        response.setFamilyMemberName(item.getUser().getName());
        response.setStartDate(item.getStartDate());
        response.setMaturityDate(item.getMaturityDate());
        response.setInterestRate(item.getInterestRate());
        response.setBankName(item.getBankName());

        String currency = item.getCurrency() != null ? item.getCurrency().toUpperCase() : "INR";
        response.setCurrency(currency);

        BigDecimal originalInvested = item.getPrincipalAmount();
        response.setOriginalInvestedAmount(originalInvested);

        response.setPrincipalAmount(item.getPrincipalAmount());
        response.setCompoundingFrequency(item.getCompoundingFrequency());

        BigDecimal originalCurrentValue = priceProviderFactory.getProvider(AssetType.FIXED_DEPOSIT).getCurrentPrice(item);
        response.setOriginalCurrentValue(originalCurrentValue);

        BigDecimal exchangeRate = currencyConversionService.getExchangeRate(currency, "INR");
        response.setExchangeRate(exchangeRate);

        BigDecimal convertedInvested = originalInvested.multiply(exchangeRate).setScale(2, RoundingMode.HALF_UP);
        BigDecimal convertedCurrentValue = originalCurrentValue.multiply(exchangeRate).setScale(2, RoundingMode.HALF_UP);

        response.setInvestedAmount(convertedInvested);
        response.setCurrentValue(convertedCurrentValue);

        BigDecimal gainLoss = convertedCurrentValue.subtract(convertedInvested);
        response.setGainLoss(gainLoss);

        BigDecimal gainPercent = BigDecimal.ZERO;
        if (convertedInvested.compareTo(BigDecimal.ZERO) > 0) {
            gainPercent = gainLoss.divide(convertedInvested, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));
        }
        response.setGainPercent(gainPercent);

        return response;
    }
}
