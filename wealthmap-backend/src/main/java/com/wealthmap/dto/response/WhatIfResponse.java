package com.wealthmap.dto.response;

import lombok.Data;

@Data
public class WhatIfResponse {
    private double originalNetWorth;
    private double projectedNetWorth;
    private double originalTotalAssets;
    private double projectedTotalAssets;
    private double difference;
}
