package com.wealthmap.dto.request;

import com.wealthmap.enums.LiabilityType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class LiabilityRequest {
    @NotBlank(message = "Name cannot be blank")
    private String name;

    @NotNull(message = "Liability type is required")
    private LiabilityType liabilityType;

    @NotNull(message = "Principal amount is required")
    @DecimalMin(value = "0.0", message = "Principal must be non-negative")
    private BigDecimal principalAmount;

    @NotNull(message = "Interest rate is required")
    @DecimalMin(value = "0.0", message = "Interest rate must be non-negative")
    private BigDecimal interestRate;

    @NotNull(message = "Tenure is required")
    @Min(value = 1, message = "Tenure must be at least 1 month")
    private Integer tenureMonths;

    @NotNull(message = "Outstanding balance is required")
    @DecimalMin(value = "0.0", message = "Outstanding balance must be non-negative")
    private BigDecimal outstandingBalance;

    private BigDecimal emi;
    private LocalDate startDate;
    private String notes;

    // Subtype optional fields
    private String lenderName;
    private String propertyAddress;
    private String purpose;
    private String institutionName;
    private String cardIssuer;
    private String lastFourDigits;
    private String vehicleModel;
    private String descriptionDetail;
}
