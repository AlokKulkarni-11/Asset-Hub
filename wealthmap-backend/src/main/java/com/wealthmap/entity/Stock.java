package com.wealthmap.entity;

import com.wealthmap.entity.base.Asset;
import jakarta.persistence.Entity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;

@Entity
@Data
@EqualsAndHashCode(callSuper = true)
public class Stock extends Asset {
    private String ticker;
    private String companyName;
    private BigDecimal quantity;
    private BigDecimal averageBuyPrice;

    @Override
    public BigDecimal getInvestedAmount() {
        if (quantity != null && averageBuyPrice != null) {
            return quantity.multiply(averageBuyPrice);
        }
        return BigDecimal.ZERO;
    }
}
