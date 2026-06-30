package com.wealthmap.repository;

import com.wealthmap.entity.PasswordResetToken;
import com.wealthmap.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    Optional<PasswordResetToken> findByOtp(String otp);
    Optional<PasswordResetToken> findByUser(User user);
    void deleteByUser(User user);
}
