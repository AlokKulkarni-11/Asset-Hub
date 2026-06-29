package com.wealthmap.dto.request;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class RealEstateRequest {
    private String propertyName;
    private String propertyType;
    private BigDecimal purchasePrice;
    private BigDecimal estimatedCurrentValue;
    private LocalDate purchaseDate;
    private String notes;
}
