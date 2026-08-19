package com.wealthmap.entity;

import com.wealthmap.entity.base.Asset;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;

@Entity
@Table(name = "cryptocurrencies")
@Data
@EqualsAndHashCode(callSuper = true)
public class Cryptocurrency extends Asset {
    private String coinId; // e.g. "bitcoin"
    private String symbol; // e.g. "btc"
    private BigDecimal units;
    private BigDecimal averageBuyPrice;

    @Override
    public BigDecimal getInvestedAmount() {
        if (units != null && averageBuyPrice != null) {
            return units.multiply(averageBuyPrice);
        }
        return BigDecimal.ZERO;
    }
}
