package com.wealthmap.dto.response;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class FamilyRollupResponse {
    private String familyName;
    private BigDecimal totalFamilyAssets;
    private BigDecimal totalFamilyLiabilities;
    private BigDecimal totalFamilyNetWorth;
    private List<MemberContribution> memberBreakdown;

    @Data
    public static class MemberContribution {
        private Long userId;
        private String userName;
        private String userEmail;
        private BigDecimal totalAssets;
        private BigDecimal totalLiabilities;
        private BigDecimal netWorth;
        private double contributionPercentage;
    }
}
