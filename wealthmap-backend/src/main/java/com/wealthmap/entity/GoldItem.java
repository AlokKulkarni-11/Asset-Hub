package com.wealthmap.entity;

import com.wealthmap.entity.base.Asset;
import com.wealthmap.enums.GoldPurity;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;

@Entity
@Table(name = "gold_items")
@Data
@EqualsAndHashCode(callSuper = true)
public class GoldItem extends Asset {

    @Column(nullable = false, precision = 10, scale = 4)
    private BigDecimal weightGrams;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private GoldPurity purity;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal purchasePrice;

    @Override
    public BigDecimal getInvestedAmount() {
        return purchasePrice;
    }
}
