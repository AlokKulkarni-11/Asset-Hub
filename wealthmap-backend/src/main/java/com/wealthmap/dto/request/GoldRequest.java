package com.wealthmap.dto.request;

import com.wealthmap.enums.GoldPurity;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class GoldRequest {

    @NotBlank(message = "Name cannot be blank")
    private String name;

    private LocalDate purchaseDate;
    private String notes;

    private Long familyMemberId;

    @NotNull(message = "Weight is required")
    @DecimalMin(value = "0.1", message = "Weight must be greater than 0")
    private BigDecimal weightGrams;

    @NotNull(message = "Purity is required")
    private GoldPurity purity;

    @NotNull(message = "Purchase price is required")
    @DecimalMin(value = "1.0", message = "Purchase price must be greater than 0")
    private BigDecimal purchasePrice;
}
