package com.wealthmap.service;

import com.wealthmap.dto.request.LiabilityRequest;
import com.wealthmap.dto.response.LiabilityResponse;
import com.wealthmap.entity.*;
import com.wealthmap.entity.base.Liability;
import com.wealthmap.enums.LiabilityType;
import com.wealthmap.repository.LiabilityRepository;
import com.wealthmap.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LiabilityService {

    private final LiabilityRepository liabilityRepository;
    private final UserRepository userRepository;

    @Transactional
    public LiabilityResponse addLiability(LiabilityRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Liability liability = createEntityFromRequest(request);
        liability.setUser(user);
        liability.setFamilyGroup(user.getFamilyGroup());
        
        populateCommonFields(liability, request);

        Liability saved = liabilityRepository.save(liability);
        return mapToResponse(saved);
    }

    @Transactional
    public LiabilityResponse updateLiability(Long id, LiabilityRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Liability existing = liabilityRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Liability not found"));

        if (!existing.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Access Denied");
        }

        // If type changed, we might need a new entity. But let's assume type is static, or recreate if changed.
        if (existing.getLiabilityType() != request.getLiabilityType()) {
            liabilityRepository.delete(existing);
            return addLiability(request, userEmail);
        }

        populateCommonFields(existing, request);
        updateSubtypeSpecificFields(existing, request);

        Liability saved = liabilityRepository.save(existing);
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<LiabilityResponse> getAllLiabilitiesForUser(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return liabilityRepository.findByUserId(user.getId())
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public LiabilityResponse getLiabilityById(Long id, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Liability liability = liabilityRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Liability not found"));

        if (!liability.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Access Denied");
        }

        return mapToResponse(liability);
    }

    @Transactional
    public void deleteLiability(Long id, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Liability liability = liabilityRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Liability not found"));

        if (!liability.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Access Denied");
        }

        liabilityRepository.delete(liability);
    }

    private Liability createEntityFromRequest(LiabilityRequest request) {
        switch (request.getLiabilityType()) {
            case HOME_LOAN:
                HomeLoan hl = new HomeLoan();
                hl.setLenderName(request.getLenderName());
                hl.setPropertyAddress(request.getPropertyAddress());
                return hl;
            case PERSONAL_LOAN:
                PersonalLoan pl = new PersonalLoan();
                pl.setLenderName(request.getLenderName());
                pl.setPurpose(request.getPurpose());
                return pl;
            case EDUCATION_LOAN:
                EducationLoan el = new EducationLoan();
                el.setLenderName(request.getLenderName());
                el.setInstitutionName(request.getInstitutionName());
                return el;
            case CREDIT_CARD_DEBT:
                CreditCardDebt cc = new CreditCardDebt();
                cc.setCardIssuer(request.getCardIssuer());
                cc.setLastFourDigits(request.getLastFourDigits());
                return cc;
            case VEHICLE_LOAN:
                VehicleLoan vl = new VehicleLoan();
                vl.setLenderName(request.getLenderName());
                vl.setVehicleModel(request.getVehicleModel());
                return vl;
            case OTHER_LIABILITY:
            default:
                OtherLiability ol = new OtherLiability();
                ol.setDescriptionDetail(request.getDescriptionDetail());
                return ol;
        }
    }

    private void updateSubtypeSpecificFields(Liability existing, LiabilityRequest request) {
        if (existing instanceof HomeLoan hl) {
            hl.setLenderName(request.getLenderName());
            hl.setPropertyAddress(request.getPropertyAddress());
        } else if (existing instanceof PersonalLoan pl) {
            pl.setLenderName(request.getLenderName());
            pl.setPurpose(request.getPurpose());
        } else if (existing instanceof EducationLoan el) {
            el.setLenderName(request.getLenderName());
            el.setInstitutionName(request.getInstitutionName());
        } else if (existing instanceof CreditCardDebt cc) {
            cc.setCardIssuer(request.getCardIssuer());
            cc.setLastFourDigits(request.getLastFourDigits());
        } else if (existing instanceof VehicleLoan vl) {
            vl.setLenderName(request.getLenderName());
            vl.setVehicleModel(request.getVehicleModel());
        } else if (existing instanceof OtherLiability ol) {
            ol.setDescriptionDetail(request.getDescriptionDetail());
        }
    }

    private void populateCommonFields(Liability entity, LiabilityRequest request) {
        entity.setName(request.getName());
        entity.setNotes(request.getNotes());
        entity.setLiabilityType(request.getLiabilityType());
        entity.setPrincipalAmount(request.getPrincipalAmount());
        entity.setInterestRate(request.getInterestRate());
        entity.setTenureMonths(request.getTenureMonths());
        entity.setOutstandingBalance(request.getOutstandingBalance());
        entity.setStartDate(request.getStartDate());

        if (request.getEmi() != null && request.getEmi().compareTo(BigDecimal.ZERO) > 0) {
            entity.setEmi(request.getEmi());
        } else {
            entity.setEmi(calculateEMI(request.getPrincipalAmount(), request.getInterestRate(), request.getTenureMonths()));
        }
    }

    public static BigDecimal calculateEMI(BigDecimal principal, BigDecimal annualRate, int tenureMonths) {
        if (principal == null || principal.compareTo(BigDecimal.ZERO) <= 0 || tenureMonths <= 0) {
            return BigDecimal.ZERO;
        }
        if (annualRate == null || annualRate.compareTo(BigDecimal.ZERO) == 0) {
            return principal.divide(BigDecimal.valueOf(tenureMonths), 2, RoundingMode.HALF_UP);
        }

        double P = principal.doubleValue();
        double r = annualRate.doubleValue() / 1200.0;
        int n = tenureMonths;

        double emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
        return BigDecimal.valueOf(emi).setScale(2, RoundingMode.HALF_UP);
    }

    private LiabilityResponse mapToResponse(Liability entity) {
        LiabilityResponse response = new LiabilityResponse();
        response.setId(entity.getId());
        response.setName(entity.getName());
        response.setLiabilityType(entity.getLiabilityType());
        response.setPrincipalAmount(entity.getPrincipalAmount());
        response.setInterestRate(entity.getInterestRate());
        response.setTenureMonths(entity.getTenureMonths());
        response.setOutstandingBalance(entity.getOutstandingBalance());
        response.setEmi(entity.getEmi());
        response.setStartDate(entity.getStartDate());
        response.setNotes(entity.getNotes());
        response.setFamilyMemberId(entity.getUser().getId());
        response.setFamilyMemberName(entity.getUser().getName());
        response.setCreatedAt(entity.getCreatedAt());
        response.setUpdatedAt(entity.getUpdatedAt());

        if (entity instanceof HomeLoan hl) {
            response.setLenderName(hl.getLenderName());
            response.setPropertyAddress(hl.getPropertyAddress());
        } else if (entity instanceof PersonalLoan pl) {
            response.setLenderName(pl.getLenderName());
            response.setPurpose(pl.getPurpose());
        } else if (entity instanceof EducationLoan el) {
            response.setLenderName(el.getLenderName());
            response.setInstitutionName(el.getInstitutionName());
        } else if (entity instanceof CreditCardDebt cc) {
            response.setCardIssuer(cc.getCardIssuer());
            response.setLastFourDigits(cc.getLastFourDigits());
        } else if (entity instanceof VehicleLoan vl) {
            response.setLenderName(vl.getLenderName());
            response.setVehicleModel(vl.getVehicleModel());
        } else if (entity instanceof OtherLiability ol) {
            response.setDescriptionDetail(ol.getDescriptionDetail());
        }

        return response;
    }
}
