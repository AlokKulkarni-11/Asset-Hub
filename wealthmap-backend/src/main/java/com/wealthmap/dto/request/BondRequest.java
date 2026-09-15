package com.wealthmap.dto.request;

import com.wealthmap.enums.BondType;
import com.wealthmap.enums.CompoundingFrequency;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class BondRequest {
    @NotBlank(message = "Bond name cannot be blank")
    private String name;

    @NotNull(message = "Bond type is required")
    private BondType bondType;

    private String issuer;

    @NotNull(message = "Start/Issue date is required")
    private LocalDate startDate;

    private LocalDate maturityDate;

    @NotNull(message = "Invested amount is required")
    @DecimalMin(value = "1.0", message = "Invested amount must be greater than 0")
    private BigDecimal investedAmount;

    private BigDecimal faceValue;
    private BigDecimal quantity;

    @NotNull(message = "Coupon / Interest rate is required")
    @DecimalMin(value = "0.0", message = "Interest rate cannot be negative")
    private BigDecimal couponRate;

    private CompoundingFrequency compoundingFrequency;

    private String currency;
    private String notes;
    private String nomineeName;
    private String nomineeRelationship;
}
