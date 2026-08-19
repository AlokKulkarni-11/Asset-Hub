package com.wealthmap.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CryptoSearchResponse {
    private String id; // e.g. "bitcoin"
    private String name; // e.g. "Bitcoin"
    private String symbol; // e.g. "BTC"
}
