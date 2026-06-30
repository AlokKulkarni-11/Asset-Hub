package com.wealthmap.service;

import com.wealthmap.dto.request.PasswordChangeRequest;
import com.wealthmap.dto.request.ProfileUpdateRequest;
import com.wealthmap.dto.response.AuthResponse;
import com.wealthmap.entity.User;
import com.wealthmap.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Transactional
    public AuthResponse updateProfile(String email, ProfileUpdateRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (request.getName() != null && !request.getName().trim().isEmpty()) {
            user.setName(request.getName());
        }
        
        user.setMobileNumber(request.getMobileNumber());
        
        userRepository.save(user);

        // We return AuthResponse because we might want to update the frontend user state
        // Token is not refreshed here for simplicity, frontend can reuse existing token
        return new AuthResponse(null, user.getId(), user.getEmail(), user.getName(), user.getMobileNumber());
    }

    @Transactional
    public void changePassword(String email, PasswordChangeRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new RuntimeException("Current password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }
}
