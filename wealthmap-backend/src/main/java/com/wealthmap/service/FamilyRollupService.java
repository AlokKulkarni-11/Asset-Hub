package com.wealthmap.service;

import com.wealthmap.dto.response.AssetResponse;
import com.wealthmap.dto.response.FamilyRollupResponse;
import com.wealthmap.dto.response.LiabilityResponse;
import com.wealthmap.entity.FamilyGroup;
import com.wealthmap.entity.User;
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
public class FamilyRollupService {

    private final UserRepository userRepository;
    private final AnalyticsService analyticsService;
    private final LiabilityService liabilityService;

    @Transactional(readOnly = true)
    public FamilyRollupResponse getFamilyRollup(String userEmail) {
        User currentUser = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        FamilyGroup familyGroup = currentUser.getFamilyGroup();
        if (familyGroup == null) {
            throw new RuntimeException("You are not in a family group.");
        }

        List<User> members = userRepository.findAll().stream()
                .filter(user -> user.getFamilyGroup() != null && user.getFamilyGroup().getId().equals(familyGroup.getId()))
                .collect(Collectors.toList());

        FamilyRollupResponse response = new FamilyRollupResponse();
        response.setFamilyName(familyGroup.getName());

        List<FamilyRollupResponse.MemberContribution> contributions = members.stream()
                .map(this::buildContribution)
                .collect(Collectors.toList());

        BigDecimal totalAssets = contributions.stream()
                .map(FamilyRollupResponse.MemberContribution::getTotalAssets)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalLiabilities = contributions.stream()
                .map(FamilyRollupResponse.MemberContribution::getTotalLiabilities)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalNetWorth = totalAssets.subtract(totalLiabilities);

        double denominator = totalNetWorth.compareTo(BigDecimal.ZERO) != 0 ? totalNetWorth.abs().doubleValue() : 0.0;
        for (FamilyRollupResponse.MemberContribution contribution : contributions) {
            double share = denominator > 0 ? contribution.getNetWorth().doubleValue() / denominator * 100.0 : 0.0;
            contribution.setContributionPercentage(share);
        }

        response.setTotalFamilyAssets(totalAssets);
        response.setTotalFamilyLiabilities(totalLiabilities);
        response.setTotalFamilyNetWorth(totalNetWorth);
        response.setMemberBreakdown(contributions);
        return response;
    }

    private FamilyRollupResponse.MemberContribution buildContribution(User member) {
        List<AssetResponse> assets = analyticsService.getAllAssetsForUser(member.getEmail());
        List<LiabilityResponse> liabilities = liabilityService.getAllLiabilitiesForUser(member.getEmail());

        BigDecimal totalAssets = assets.stream()
                .map(asset -> asset.getCurrentValue() != null ? asset.getCurrentValue() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalLiabilities = liabilities.stream()
                .map(liability -> liability.getOutstandingBalance() != null ? liability.getOutstandingBalance() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal netWorth = totalAssets.subtract(totalLiabilities);

        FamilyRollupResponse.MemberContribution contribution = new FamilyRollupResponse.MemberContribution();
        contribution.setUserId(member.getId());
        contribution.setUserName(member.getName());
        contribution.setUserEmail(member.getEmail());
        contribution.setTotalAssets(totalAssets.setScale(2, RoundingMode.HALF_UP));
        contribution.setTotalLiabilities(totalLiabilities.setScale(2, RoundingMode.HALF_UP));
        contribution.setNetWorth(netWorth.setScale(2, RoundingMode.HALF_UP));
        return contribution;
    }
}
