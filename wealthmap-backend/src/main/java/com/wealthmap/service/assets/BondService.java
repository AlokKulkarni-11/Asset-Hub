package com.wealthmap.service.assets;

import com.wealthmap.dto.request.BondRequest;
import com.wealthmap.dto.response.AssetResponse;
import com.wealthmap.dto.response.BondResponse;
import com.wealthmap.entity.Bond;
import com.wealthmap.entity.User;
import com.wealthmap.enums.AssetType;
import com.wealthmap.repository.AssetRepository;
import com.wealthmap.repository.UserRepository;
import com.wealthmap.service.price.PriceProviderFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BondService {

    private final AssetRepository assetRepository;
    private final UserRepository userRepository;
    private final PriceProviderFactory priceProviderFactory;
    private final com.wealthmap.service.CurrencyConversionService currencyConversionService;

    @Transactional
    public AssetResponse addBond(BondRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Bond bond = new Bond();
        bond.setUser(user);
        bond.setFamilyGroup(user.getFamilyGroup());
        bond.setName(request.getName());
        bond.setAssetType(AssetType.BOND);
        bond.setBondType(request.getBondType());
        bond.setIssuer(request.getIssuer());
        bond.setPurchaseDate(request.getStartDate());
        bond.setStartDate(request.getStartDate());
        bond.setMaturityDate(request.getMaturityDate());
        bond.setInvestedAmount(request.getInvestedAmount());
        bond.setFaceValue(request.getFaceValue());
        bond.setQuantity(request.getQuantity());
        bond.setCouponRate(request.getCouponRate());
        bond.setCompoundingFrequency(request.getCompoundingFrequency());
        bond.setNotes(request.getNotes());
        bond.setNomineeName(request.getNomineeName());
        bond.setNomineeRelationship(request.getNomineeRelationship());
        bond.setCurrency(request.getCurrency() != null && !request.getCurrency().trim().isEmpty() ? request.getCurrency().toUpperCase() : "INR");

        Bond saved = assetRepository.save(bond);
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public BondResponse getBondById(Long id, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Bond bond = (Bond) assetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Asset not found"));
        if (!bond.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Access Denied");
        }
        return mapToResponse(bond);
    }

    @Transactional
    public BondResponse updateBond(Long id, BondRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Bond bond = (Bond) assetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Asset not found"));
        if (!bond.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Access Denied");
        }

        bond.setName(request.getName());
        bond.setBondType(request.getBondType());
        bond.setIssuer(request.getIssuer());
        bond.setPurchaseDate(request.getStartDate());
        bond.setStartDate(request.getStartDate());
        bond.setMaturityDate(request.getMaturityDate());
        bond.setInvestedAmount(request.getInvestedAmount());
        bond.setFaceValue(request.getFaceValue());
        bond.setQuantity(request.getQuantity());
        bond.setCouponRate(request.getCouponRate());
        bond.setCompoundingFrequency(request.getCompoundingFrequency());
        bond.setNotes(request.getNotes());
        bond.setNomineeName(request.getNomineeName());
        bond.setNomineeRelationship(request.getNomineeRelationship());
        bond.setCurrency(request.getCurrency() != null && !request.getCurrency().trim().isEmpty() ? request.getCurrency().toUpperCase() : "INR");

        Bond saved = assetRepository.save(bond);
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<AssetResponse> getAllBondsForUser(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return assetRepository.findByUserIdAndAssetType(user.getId(), AssetType.BOND)
                .stream()
                .map(asset -> mapToResponse((Bond) asset))
                .collect(Collectors.toList());
    }

    public BondResponse mapToResponse(Bond bond) {
        BondResponse response = new BondResponse();
        response.setId(bond.getId());
        response.setName(bond.getName());
        response.setAssetType(bond.getAssetType());
        response.setBondType(bond.getBondType());
        response.setIssuer(bond.getIssuer());
        response.setPurchaseDate(bond.getPurchaseDate());
        response.setStartDate(bond.getStartDate());
        response.setMaturityDate(bond.getMaturityDate());

        String currency = bond.getCurrency() != null ? bond.getCurrency().toUpperCase() : "INR";
        response.setCurrency(currency);

        BigDecimal originalInvested = bond.getInvestedAmount();
        response.setOriginalInvestedAmount(originalInvested);

        response.setFaceValue(bond.getFaceValue());
        response.setQuantity(bond.getQuantity());
        response.setCouponRate(bond.getCouponRate());
        response.setInterestRate(bond.getCouponRate());
        response.setCompoundingFrequency(bond.getCompoundingFrequency());
        response.setNotes(bond.getNotes());
        response.setNomineeName(bond.getNomineeName());
        response.setNomineeRelationship(bond.getNomineeRelationship());

        if (bond.getUser() != null) {
            response.setFamilyMemberId(bond.getUser().getId());
            response.setFamilyMemberName(bond.getUser().getName());
        }

        BigDecimal originalCurrentValue = priceProviderFactory.getProvider(AssetType.BOND).getCurrentPrice(bond);
        response.setOriginalCurrentValue(originalCurrentValue);

        BigDecimal exchangeRate = currencyConversionService.getExchangeRate(currency, "INR");
        response.setExchangeRate(exchangeRate);

        BigDecimal convertedInvested = originalInvested.multiply(exchangeRate).setScale(2, RoundingMode.HALF_UP);
        BigDecimal convertedCurrentValue = originalCurrentValue.multiply(exchangeRate).setScale(2, RoundingMode.HALF_UP);

        response.setInvestedAmount(convertedInvested);
        response.setCurrentValue(convertedCurrentValue);

        BigDecimal gainLoss = convertedCurrentValue.subtract(convertedInvested);
        response.setGainLoss(gainLoss);
        response.setAccruedInterest(gainLoss.compareTo(BigDecimal.ZERO) > 0 ? gainLoss : BigDecimal.ZERO);

        BigDecimal gainPercent = BigDecimal.ZERO;
        if (convertedInvested.compareTo(BigDecimal.ZERO) > 0) {
            gainPercent = gainLoss.divide(convertedInvested, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100));
        }
        response.setGainPercent(gainPercent);

        if (bond.getMaturityDate() != null) {
            long days = ChronoUnit.DAYS.between(LocalDate.now(), bond.getMaturityDate());
            response.setDaysToMaturity(days);
        }

        return response;
    }
}
