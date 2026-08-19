package com.wealthmap.dto.response;

import com.wealthmap.enums.LiabilityType;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class LiabilityResponse {
    private Long id;
    private String name;
    private LiabilityType liabilityType;
    private BigDecimal principalAmount;
    private BigDecimal interestRate;
    private Integer tenureMonths;
    private BigDecimal outstandingBalance;
    private BigDecimal emi;
    private LocalDate startDate;
    private String notes;
    private Long familyMemberId;
    private String familyMemberName;

    // Subtype-specific fields
    private String lenderName;
    private String propertyAddress;
    private String purpose;
    private String institutionName;
    private String cardIssuer;
    private String lastFourDigits;
    private String vehicleModel;
    private String descriptionDetail;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
