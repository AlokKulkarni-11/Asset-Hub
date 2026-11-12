package com.wealthmap.entity;

import com.wealthmap.entity.base.Asset;
import com.wealthmap.enums.SilverPurity;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;

@Entity
@Table(name = "silver_items")
@Data
@EqualsAndHashCode(callSuper = true)
public class SilverItem extends Asset {

    @Column(nullable = false, precision = 10, scale = 4)
    private BigDecimal weightGrams;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SilverPurity purity;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal purchasePrice;

    @Override
    public BigDecimal getInvestedAmount() {
        return purchasePrice;
    }
}
