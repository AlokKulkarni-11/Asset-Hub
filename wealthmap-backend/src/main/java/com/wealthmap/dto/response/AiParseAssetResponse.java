package com.wealthmap.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiParseAssetResponse {
    private String assetType; // STOCK, MUTUAL_FUND, GOLD, FIXED_DEPOSIT, REAL_ESTATE, CRYPTOCURRENCY, BOND, ESOP_RSU
    private String liabilityType; // HOME_LOAN, PERSONAL_LOAN, EDUCATION_LOAN, CREDIT_CARD_DEBT, VEHICLE_LOAN, OTHER_LIABILITY
    private boolean isLiability;
    private String rawInput;
    private Map<String, Object> fields; // e.g. name, ticker, amount, quantity, rate, dates, etc.
    private double confidenceScore;
    private String summary;
    private boolean ambiguous;
}
