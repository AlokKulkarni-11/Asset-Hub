package com.wealthmap.dto.request;

import lombok.Data;
import java.util.List;

@Data
public class AiChatRequest {
    private String message;
    private List<ChatMessageDto> history;
    private boolean useLivePortfolio = true;

    @Data
    public static class ChatMessageDto {
        private String role; // "user" or "model" / "assistant"
        private String content;
    }
}
