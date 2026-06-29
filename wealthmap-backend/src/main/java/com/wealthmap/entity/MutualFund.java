package com.wealthmap.entity;

import com.wealthmap.entity.base.Asset;
import jakarta.persistence.Entity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;

@Entity
@Data
@EqualsAndHashCode(callSuper = true)
public class MutualFund extends Asset {
    private String schemeCode; // AMFI Scheme Code
    private String schemeName;
    private String folioNumber;
    private BigDecimal units;
    private BigDecimal averageNav;

    @Override
    public BigDecimal getInvestedAmount() {
        if (units != null && averageNav != null) {
            return units.multiply(averageNav);
        }
        return BigDecimal.ZERO;
    }
}
