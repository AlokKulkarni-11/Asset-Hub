package com.wealthmap.entity;

import com.wealthmap.entity.base.Asset;
import jakarta.persistence.Entity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;

@Entity
@Data
@EqualsAndHashCode(callSuper = true)
public class RealEstate extends Asset {
    private String propertyName;
    private String propertyType;
    private BigDecimal purchasePrice;
    private BigDecimal estimatedCurrentValue;

    @Override
    public BigDecimal getInvestedAmount() {
        return purchasePrice != null ? purchasePrice : BigDecimal.ZERO;
    }
}
