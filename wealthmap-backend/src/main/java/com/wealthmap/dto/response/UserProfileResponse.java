package com.wealthmap.dto.response;

import lombok.Data;

@Data
public class UserProfileResponse {
    private Long id;
    private String name;
    private String email;
    private String mobileNumber;
    private boolean tfaEnabled;
}
