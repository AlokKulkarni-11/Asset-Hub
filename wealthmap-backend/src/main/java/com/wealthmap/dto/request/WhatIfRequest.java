package com.wealthmap.dto.request;

import lombok.Data;
import java.util.Map;

@Data
public class WhatIfRequest {
    private Map<String, Double> changes;
}
