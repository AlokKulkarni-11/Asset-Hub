package com.wealthmap.dto.request;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class MutualFundRequest {
    private String schemeCode;
    private String schemeName;
    private String folioNumber;
    private BigDecimal units;
    private BigDecimal averageNav;
    private LocalDate purchaseDate;
    private String notes;
}
