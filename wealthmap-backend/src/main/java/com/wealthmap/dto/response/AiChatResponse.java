package com.wealthmap.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiChatResponse {
    private String reply;
    private boolean groundedInRealData;
    private List<String> referencedDataPoints; // e.g. "Net Worth: ₹45,20,000", "Liquid Assets: ₹8,50,000"
    private List<String> suggestedFollowUps;
    private Map<String, Object> calculatorResult; // if a calculation was run
}
