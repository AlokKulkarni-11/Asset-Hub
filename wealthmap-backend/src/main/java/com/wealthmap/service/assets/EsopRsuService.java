package com.wealthmap.service.assets;

import com.wealthmap.dto.request.EsopRsuRequest;
import com.wealthmap.dto.response.AssetResponse;
import com.wealthmap.dto.response.EsopRsuResponse;
import com.wealthmap.entity.EsopRsu;
import com.wealthmap.entity.User;
import com.wealthmap.enums.AssetType;
import com.wealthmap.repository.AssetRepository;
import com.wealthmap.repository.UserRepository;
import com.wealthmap.service.price.EsopRsuPriceProvider;
import com.wealthmap.service.price.PriceProviderFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EsopRsuService {

    private final AssetRepository assetRepository;
    private final UserRepository userRepository;
    private final PriceProviderFactory priceProviderFactory;
    private final EsopRsuPriceProvider esopRsuPriceProvider;
    private final com.wealthmap.service.CurrencyConversionService currencyConversionService;

    @Transactional
    public AssetResponse addEsopRsu(EsopRsuRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        EsopRsu esop = new EsopRsu();
        esop.setUser(user);
        esop.setFamilyGroup(user.getFamilyGroup());
        esop.setName(request.getName());
        esop.setAssetType(AssetType.ESOP_RSU);
        esop.setPlanType(request.getPlanType());
        esop.setCompanyName(request.getCompanyName());
        esop.setTicker(request.getTicker());
        esop.setPurchaseDate(request.getGrantDate());
        esop.setGrantDate(request.getGrantDate());
        esop.setVestingStartDate(request.getVestingStartDate());
        esop.setTotalUnitsGranted(request.getTotalUnitsGranted());
        esop.setVestedUnits(request.getVestedUnits());

        BigDecimal unvested = request.getUnvestedUnits();
        if (unvested == null && request.getTotalUnitsGranted() != null && request.getVestedUnits() != null) {
            unvested = request.getTotalUnitsGranted().subtract(request.getVestedUnits());
            if (unvested.compareTo(BigDecimal.ZERO) < 0) unvested = BigDecimal.ZERO;
        }
        esop.setUnvestedUnits(unvested != null ? unvested : BigDecimal.ZERO);

        esop.setStrikePrice(request.getStrikePrice() != null ? request.getStrikePrice() : BigDecimal.ZERO);
        esop.setCurrentStockPrice(request.getCurrentStockPrice());
        esop.setCurrency(request.getCurrency() != null && !request.getCurrency().trim().isEmpty() ? request.getCurrency().toUpperCase() : "INR");
        esop.setNotes(request.getNotes());
        esop.setNomineeName(request.getNomineeName());
        esop.setNomineeRelationship(request.getNomineeRelationship());

        EsopRsu saved = assetRepository.save(esop);
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public EsopRsuResponse getEsopRsuById(Long id, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        EsopRsu esop = (EsopRsu) assetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Asset not found"));
        if (!esop.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Access Denied");
        }
        return mapToResponse(esop);
    }

    @Transactional
    public EsopRsuResponse updateEsopRsu(Long id, EsopRsuRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        EsopRsu esop = (EsopRsu) assetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Asset not found"));
        if (!esop.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Access Denied");
        }

        esop.setName(request.getName());
        esop.setPlanType(request.getPlanType());
        esop.setCompanyName(request.getCompanyName());
        esop.setTicker(request.getTicker());
        esop.setPurchaseDate(request.getGrantDate());
        esop.setGrantDate(request.getGrantDate());
        esop.setVestingStartDate(request.getVestingStartDate());
        esop.setTotalUnitsGranted(request.getTotalUnitsGranted());
        esop.setVestedUnits(request.getVestedUnits());

        BigDecimal unvested = request.getUnvestedUnits();
        if (unvested == null && request.getTotalUnitsGranted() != null && request.getVestedUnits() != null) {
            unvested = request.getTotalUnitsGranted().subtract(request.getVestedUnits());
            if (unvested.compareTo(BigDecimal.ZERO) < 0) unvested = BigDecimal.ZERO;
        }
        esop.setUnvestedUnits(unvested != null ? unvested : BigDecimal.ZERO);

        esop.setStrikePrice(request.getStrikePrice() != null ? request.getStrikePrice() : BigDecimal.ZERO);
        esop.setCurrentStockPrice(request.getCurrentStockPrice());
        esop.setCurrency(request.getCurrency() != null && !request.getCurrency().trim().isEmpty() ? request.getCurrency().toUpperCase() : "INR");
        esop.setNotes(request.getNotes());
        esop.setNomineeName(request.getNomineeName());
        esop.setNomineeRelationship(request.getNomineeRelationship());

        EsopRsu saved = assetRepository.save(esop);
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<AssetResponse> getAllEsopRsusForUser(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return assetRepository.findByUserIdAndAssetType(user.getId(), AssetType.ESOP_RSU)
                .stream()
                .map(asset -> mapToResponse((EsopRsu) asset))
                .collect(Collectors.toList());
    }

    public EsopRsuResponse mapToResponse(EsopRsu esop) {
        EsopRsuResponse response = new EsopRsuResponse();
        response.setId(esop.getId());
        response.setName(esop.getName());
        response.setAssetType(esop.getAssetType());
        response.setPlanType(esop.getPlanType());
        response.setCompanyName(esop.getCompanyName());
        response.setTicker(esop.getTicker());
        response.setPurchaseDate(esop.getPurchaseDate());
        response.setGrantDate(esop.getGrantDate());
        response.setVestingStartDate(esop.getVestingStartDate());
        response.setTotalUnitsGranted(esop.getTotalUnitsGranted());
        response.setVestedUnits(esop.getVestedUnits());
        response.setUnvestedUnits(esop.getUnvestedUnits());
        response.setStrikePrice(esop.getStrikePrice());

        String currency = esop.getCurrency() != null ? esop.getCurrency().toUpperCase() : "INR";
        response.setCurrency(currency);

        response.setNotes(esop.getNotes());
        response.setNomineeName(esop.getNomineeName());
        response.setNomineeRelationship(esop.getNomineeRelationship());

        if (esop.getUser() != null) {
            response.setFamilyMemberId(esop.getUser().getId());
            response.setFamilyMemberName(esop.getUser().getName());
        }

        BigDecimal effectivePrice = esopRsuPriceProvider.fetchLiveOrEstimatedPrice(esop);
        response.setCurrentStockPrice(effectivePrice);
        response.setIsLivePrice(esop.getTicker() != null && !esop.getTicker().trim().isEmpty());

        BigDecimal vestedUnits = esop.getVestedUnits() != null ? esop.getVestedUnits() : BigDecimal.ZERO;
        BigDecimal unvestedUnits = esop.getUnvestedUnits() != null ? esop.getUnvestedUnits() : BigDecimal.ZERO;
        BigDecimal strike = esop.getStrikePrice() != null ? esop.getStrikePrice() : BigDecimal.ZERO;

        BigDecimal originalVestedValue = vestedUnits.multiply(effectivePrice).setScale(2, RoundingMode.HALF_UP);
        BigDecimal originalUnvestedValue = unvestedUnits.multiply(effectivePrice).setScale(2, RoundingMode.HALF_UP);
        BigDecimal originalTotalPotential = originalVestedValue.add(originalUnvestedValue);

        // Exercisable gain = Vested Units * Max(0, CurrentPrice - StrikePrice)
        BigDecimal perShareGain = effectivePrice.subtract(strike);
        if (perShareGain.compareTo(BigDecimal.ZERO) < 0) perShareGain = BigDecimal.ZERO;
        BigDecimal originalExercisableGain = vestedUnits.multiply(perShareGain).setScale(2, RoundingMode.HALF_UP);

        response.setVestedValue(originalVestedValue);
        response.setUnvestedValue(originalUnvestedValue);
        response.setTotalPotentialValue(originalTotalPotential);
        response.setExercisableGain(originalExercisableGain);

        BigDecimal originalInvested = esop.getInvestedAmount();
        response.setOriginalInvestedAmount(originalInvested);
        response.setOriginalCurrentValue(originalVestedValue);

        BigDecimal exchangeRate = currencyConversionService.getExchangeRate(currency, "INR");
        response.setExchangeRate(exchangeRate);

        BigDecimal convertedInvested = originalInvested.multiply(exchangeRate).setScale(2, RoundingMode.HALF_UP);
        BigDecimal convertedCurrentValue = originalVestedValue.multiply(exchangeRate).setScale(2, RoundingMode.HALF_UP);

        response.setInvestedAmount(convertedInvested);
        response.setCurrentValue(convertedCurrentValue);

        BigDecimal gainLoss = convertedCurrentValue.subtract(convertedInvested);
        response.setGainLoss(gainLoss);

        BigDecimal gainPercent = BigDecimal.ZERO;
        if (convertedInvested.compareTo(BigDecimal.ZERO) > 0) {
            gainPercent = gainLoss.divide(convertedInvested, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100));
        }
        response.setGainPercent(gainPercent);

        return response;
    }
}
