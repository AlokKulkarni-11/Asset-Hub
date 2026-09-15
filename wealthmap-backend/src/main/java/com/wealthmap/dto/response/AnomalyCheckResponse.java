package com.wealthmap.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnomalyCheckResponse {
    private boolean isAnomaly;
    private String severity; // "LOW", "MEDIUM", "HIGH"
    private String fieldName;
    private String warningMessage;
    private String suggestion;
    private List<String> flags;
}
