package com.wealthmap.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AiParseAssetRequest {
    @NotBlank(message = "Natural language text cannot be empty")
    private String text;
}
