package com.wealthmap.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "password_reset_tokens")
@Data
@NoArgsConstructor
public class PasswordResetToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String otp;

    @OneToOne(targetEntity = User.class, fetch = FetchType.EAGER)
    @JoinColumn(nullable = false, name = "user_id")
    private User user;

    @Column(nullable = false)
    private LocalDateTime expiryDate;

    @Column(nullable = false)
    private int attemptCount = 0;

    public PasswordResetToken(String otp, User user) {
        this.otp = otp;
        this.user = user;
        // Set expiry to 10 minutes from creation
        this.expiryDate = LocalDateTime.now().plusMinutes(10);
        this.attemptCount = 0;
    }
}
