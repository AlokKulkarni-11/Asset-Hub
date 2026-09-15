package com.wealthmap.dto.request;

import com.fasterxml.jackson.annotation.JsonAlias;
import lombok.Data;

@Data
public class GoogleOAuthRequest {
    @JsonAlias({"authCode", "code"})
    private String code; // OAuth authorization code
    private String redirectUri;
    private String idToken; // Optional Google JWT ID token from Google Identity Services
}
