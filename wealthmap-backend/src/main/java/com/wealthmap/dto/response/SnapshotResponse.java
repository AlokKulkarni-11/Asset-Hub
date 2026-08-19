package com.wealthmap.dto.response;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SnapshotResponse {
    private LocalDate date;
    private BigDecimal totalNetWorth;
    private BigDecimal totalInvested;
    private BigDecimal totalAssets;
    private BigDecimal totalLiabilities;
}
