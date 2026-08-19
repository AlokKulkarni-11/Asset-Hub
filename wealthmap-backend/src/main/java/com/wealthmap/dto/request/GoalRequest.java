package com.wealthmap.dto.request;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class GoalRequest {
    private String name;
    private BigDecimal targetAmount;
    private LocalDate targetDate;
    private String notes;
    private List<Long> taggedAssetIds;
}
