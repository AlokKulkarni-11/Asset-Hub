package com.wealthmap.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class CryptoRequest {
    @NotBlank(message = "Coin ID is required")
    private String coinId;

    @NotBlank(message = "Symbol is required")
    private String symbol;

    @NotBlank(message = "Name is required")
    private String name;

    @NotNull(message = "Purchase date is required")
    private LocalDate purchaseDate;

    @NotNull(message = "Units are required")
    @DecimalMin(value = "0.00000001", message = "Units must be greater than 0")
    private BigDecimal units;

    @NotNull(message = "Average buy price is required")
    @DecimalMin(value = "0.01", message = "Buy price must be greater than 0")
    private BigDecimal averageBuyPrice;
    
    private String currency;
    private String notes;
    private String nomineeName;
    private String nomineeRelationship;
}
