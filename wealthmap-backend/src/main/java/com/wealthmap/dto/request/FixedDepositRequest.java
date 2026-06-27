package com.wealthmap.dto.request;

import com.wealthmap.enums.CompoundingFrequency;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class FixedDepositRequest {
    @NotBlank(message = "Name cannot be blank")
    private String name;

    @NotBlank(message = "Bank name cannot be blank")
    private String bankName;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    @NotNull(message = "Maturity date is required")
    private LocalDate maturityDate;

    @NotNull(message = "Principal amount is required")
    @DecimalMin(value = "1.0", message = "Principal must be greater than 0")
    private BigDecimal principalAmount;

    @NotNull(message = "Interest rate is required")
    @DecimalMin(value = "0.1", message = "Interest rate must be greater than 0")
    private BigDecimal interestRate;

    @NotNull(message = "Compounding frequency is required")
    private CompoundingFrequency compoundingFrequency;
    
    private String notes;
}
