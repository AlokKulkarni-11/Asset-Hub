package com.wealthmap.security;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * In-memory brute force protection using high-performance Caffeine cache.
 * Provides two levels of defense:
 * 1. IP Rate Limiting: 5 requests per IP per minute on sensitive endpoints.
 * 2. Account-Level Lockout: 3 failed password attempts locks the account for 30 minutes.
 */
@Service
public class LoginAttemptService {

    public static final int MAX_IP_REQUESTS_PER_MINUTE = 5;
    public static final int MAX_FAILED_LOGIN_ATTEMPTS = 3;
    public static final long ACCOUNT_LOCKOUT_MINUTES = 30;

    // Cache tracking IP requests: key = IP string, value = AtomicInteger (expires after 1 minute)
    private final Cache<String, AtomicInteger> ipRequestCache = Caffeine.newBuilder()
            .expireAfterWrite(1, TimeUnit.MINUTES)
            .maximumSize(50_000)
            .build();

    // Cache tracking failed login attempts: key = normalized email, value = AtomicInteger (expires 30 minutes after last write)
    private final Cache<String, AtomicInteger> failedLoginCache = Caffeine.newBuilder()
            .expireAfterWrite(Duration.ofMinutes(ACCOUNT_LOCKOUT_MINUTES))
            .maximumSize(50_000)
            .build();

    // Cache storing lockout timestamps: key = normalized email, value = lock expiration epoch ms
    private final Cache<String, Long> accountLockCache = Caffeine.newBuilder()
            .expireAfterWrite(Duration.ofMinutes(ACCOUNT_LOCKOUT_MINUTES))
            .maximumSize(50_000)
            .build();

    // ==============================================================
    // 1. IP-LEVEL RATE LIMITING (5 requests / IP / min)
    // ==============================================================

    public boolean isIpRateLimited(String ipAddress) {
        if (ipAddress == null || ipAddress.isBlank()) {
            return false;
        }
        AtomicInteger counter = ipRequestCache.get(ipAddress, k -> new AtomicInteger(0));
        return counter.incrementAndGet() > MAX_IP_REQUESTS_PER_MINUTE;
    }

    public int getRemainingIpRequests(String ipAddress) {
        AtomicInteger counter = ipRequestCache.getIfPresent(ipAddress);
        int used = counter != null ? counter.get() : 0;
        return Math.max(0, MAX_IP_REQUESTS_PER_MINUTE - used);
    }

    // ==============================================================
    // 2. ACCOUNT-LEVEL LOCKOUT (3 failed attempts -> 30 min lock)
    // ==============================================================

    public boolean isAccountLocked(String email) {
        if (email == null || email.isBlank()) {
            return false;
        }
        String key = email.toLowerCase().trim();
        Long lockUntil = accountLockCache.getIfPresent(key);
        if (lockUntil != null) {
            if (System.currentTimeMillis() < lockUntil) {
                return true;
            } else {
                // Lock has expired
                accountLockCache.invalidate(key);
                failedLoginCache.invalidate(key);
            }
        }
        return false;
    }

    public long getRemainingLockoutMinutes(String email) {
        if (email == null) return 0;
        String key = email.toLowerCase().trim();
        Long lockUntil = accountLockCache.getIfPresent(key);
        if (lockUntil != null && lockUntil > System.currentTimeMillis()) {
            long diffMs = lockUntil - System.currentTimeMillis();
            return (diffMs / (60 * 1000)) + 1;
        }
        return 0;
    }

    public int recordFailedAttempt(String email) {
        if (email == null || email.isBlank()) return 0;
        String key = email.toLowerCase().trim();

        AtomicInteger attempts = failedLoginCache.get(key, k -> new AtomicInteger(0));
        int current = attempts.incrementAndGet();

        if (current >= MAX_FAILED_LOGIN_ATTEMPTS) {
            long lockExpiry = System.currentTimeMillis() + (ACCOUNT_LOCKOUT_MINUTES * 60 * 1000);
            accountLockCache.put(key, lockExpiry);
        }
        return current;
    }

    public void loginSucceeded(String email) {
        if (email != null && !email.isBlank()) {
            String key = email.toLowerCase().trim();
            failedLoginCache.invalidate(key);
            accountLockCache.invalidate(key);
        }
    }
}
