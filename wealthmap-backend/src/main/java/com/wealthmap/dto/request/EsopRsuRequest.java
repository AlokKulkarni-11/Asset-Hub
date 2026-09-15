package com.wealthmap.dto.request;

import com.wealthmap.enums.EsopPlanType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class EsopRsuRequest {
    @NotBlank(message = "Plan name / Company name is required")
    private String name;

    @NotNull(message = "Plan type is required")
    private EsopPlanType planType;

    @NotBlank(message = "Company name is required")
    private String companyName;

    private String ticker; // optional, e.g. "GOOGL", "ZOMATO.NS"

    private LocalDate grantDate;
    private LocalDate vestingStartDate;

    @NotNull(message = "Total units granted is required")
    @DecimalMin(value = "0.01", message = "Total units must be greater than 0")
    private BigDecimal totalUnitsGranted;

    @NotNull(message = "Vested units is required")
    @DecimalMin(value = "0.0", message = "Vested units cannot be negative")
    private BigDecimal vestedUnits;

    private BigDecimal unvestedUnits;

    private BigDecimal strikePrice; // exercise price per unit (0 for RSUs)

    @NotNull(message = "Current stock price / valuation is required")
    @DecimalMin(value = "0.01", message = "Stock price must be greater than 0")
    private BigDecimal currentStockPrice;

    private String currency; // "INR" or "USD"

    private String notes;
    private String nomineeName;
    private String nomineeRelationship;
}
