package com.wealthmap.entity;

import com.wealthmap.entity.base.Asset;
import com.wealthmap.enums.BondType;
import com.wealthmap.enums.CompoundingFrequency;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "bonds")
@Data
@EqualsAndHashCode(callSuper = true)
public class Bond extends Asset {

    @Enumerated(EnumType.STRING)
    private BondType bondType;

    private String issuer;
    private BigDecimal couponRate;
    private BigDecimal investedAmount;
    private BigDecimal faceValue;
    private BigDecimal quantity;
    private LocalDate startDate;
    private LocalDate maturityDate;

    @Enumerated(EnumType.STRING)
    private CompoundingFrequency compoundingFrequency;

    @Override
    public BigDecimal getInvestedAmount() {
        if (investedAmount != null) {
            return investedAmount;
        }
        if (quantity != null && faceValue != null) {
            return quantity.multiply(faceValue);
        }
        return BigDecimal.ZERO;
    }
}
