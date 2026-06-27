package com.wealthmap.dto.response;

import lombok.Data;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@AllArgsConstructor
public class SnapshotResponse {
    private LocalDate date;
    private BigDecimal totalNetWorth;
    private BigDecimal totalInvested;
}
