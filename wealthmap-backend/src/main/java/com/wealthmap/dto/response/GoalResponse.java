package com.wealthmap.dto.response;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class GoalResponse {
    private Long id;
    private String name;
    private BigDecimal targetAmount;
    private LocalDate targetDate;
    private String notes;
    private List<Long> taggedAssetIds;
    private BigDecimal currentSavedAmount;
    private double progressPercentage;
    private boolean shared;
    private Long familyGroupId;
}
