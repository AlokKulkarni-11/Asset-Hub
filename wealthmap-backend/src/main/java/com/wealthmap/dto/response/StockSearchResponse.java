package com.wealthmap.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StockSearchResponse {
    private String symbol;
    private String companyName;
    private String exchange;
}
