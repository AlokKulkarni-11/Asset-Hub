package com.wealthmap.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AuthResponse {
    private String token;
    private Long id;
    private String email;
    private String name;
    private String mobileNumber;
    private boolean tfaRequired;
    private String tfaToken;

    public AuthResponse(String token, Long id, String email, String name, String mobileNumber) {
        this.token = token;
        this.id = id;
        this.email = email;
        this.name = name;
        this.mobileNumber = mobileNumber;
        this.tfaRequired = false;
        this.tfaToken = null;
    }
}
