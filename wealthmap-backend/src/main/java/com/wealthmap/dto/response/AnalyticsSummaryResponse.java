package com.wealthmap.dto.response;

import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
public class AnalyticsSummaryResponse {
    private double portfolioXirr;
    private double portfolioCagr;
    private List<String> warnings;
    private AssetPerformanceCallout bestPerformer;
    private AssetPerformanceCallout worstPerformer;
    private Map<Long, AssetAnalytics> assetAnalytics;

    @Data
    public static class AssetPerformanceCallout {
        private Long assetId;
        private String name;
        private String assetType;
        private double gainPercentage;
        private double currentValue;
    }

    @Data
    public static class AssetAnalytics {
        private double xirr;
        private double cagr;
        private double gainPercentage;
    }
}
