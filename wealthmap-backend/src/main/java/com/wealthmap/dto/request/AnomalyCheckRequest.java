package com.wealthmap.dto.request;

import lombok.Data;
import java.util.Map;

@Data
public class AnomalyCheckRequest {
    private String assetType;
    private Map<String, Object> values;
}
