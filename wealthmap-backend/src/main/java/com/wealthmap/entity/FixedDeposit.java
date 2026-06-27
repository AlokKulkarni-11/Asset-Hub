package com.wealthmap.entity;

import com.wealthmap.entity.base.Asset;
import com.wealthmap.enums.CompoundingFrequency;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Data
@EqualsAndHashCode(callSuper = true)
public class FixedDeposit extends Asset {
    private String bankName;
    private LocalDate startDate;
    private LocalDate maturityDate;
    private BigDecimal principalAmount;
    private BigDecimal interestRate;

    @Enumerated(EnumType.STRING)
    private CompoundingFrequency compoundingFrequency;

    @Override
    public BigDecimal getInvestedAmount() {
        return principalAmount != null ? principalAmount : BigDecimal.ZERO;
    }
}
