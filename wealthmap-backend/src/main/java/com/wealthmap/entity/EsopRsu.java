package com.wealthmap.entity;

import com.wealthmap.entity.base.Asset;
import com.wealthmap.enums.EsopPlanType;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "esop_rsus")
@Data
@EqualsAndHashCode(callSuper = true)
public class EsopRsu extends Asset {

    @Enumerated(EnumType.STRING)
    private EsopPlanType planType;

    private String companyName;
    private String ticker;
    private LocalDate grantDate;
    private LocalDate vestingStartDate;
    private BigDecimal totalUnitsGranted;
    private BigDecimal vestedUnits;
    private BigDecimal unvestedUnits;
    private BigDecimal strikePrice;
    private BigDecimal currentStockPrice;

    @Override
    public BigDecimal getInvestedAmount() {
        if (vestedUnits != null && strikePrice != null) {
            return vestedUnits.multiply(strikePrice);
        }
        return BigDecimal.ZERO;
    }
}
