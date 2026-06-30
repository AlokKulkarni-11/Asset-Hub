package com.wealthmap.controller;

import com.wealthmap.dto.request.PasswordChangeRequest;
import com.wealthmap.dto.request.ProfileUpdateRequest;
import com.wealthmap.dto.response.AuthResponse;
import com.wealthmap.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    @Autowired
    private UserService userService;

    @PutMapping("/profile")
    public ResponseEntity<AuthResponse> updateProfile(Authentication authentication, @Valid @RequestBody ProfileUpdateRequest request) {
        String email = authentication.getName();
        return ResponseEntity.ok(userService.updateProfile(email, request));
    }

    @PutMapping("/password")
    public ResponseEntity<?> changePassword(Authentication authentication, @Valid @RequestBody PasswordChangeRequest request) {
        String email = authentication.getName();
        try {
            userService.changePassword(email, request);
            return ResponseEntity.ok("Password changed successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
