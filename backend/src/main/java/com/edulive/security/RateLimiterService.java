package com.edulive.security;

import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RateLimiterService {

    private static final int MAX_ATTEMPTS = 5;
    private static final long TIME_WINDOW_MS = 60 * 1000; // 1 minute

    private final Map<String, ClientAttempt> attempts = new ConcurrentHashMap<>();

    public boolean isAllowed(String key) {
        long now = System.currentTimeMillis();
        ClientAttempt attempt = attempts.compute(key, (k, existing) -> {
            if (existing == null || now - existing.firstAttemptTime > TIME_WINDOW_MS) {
                return new ClientAttempt(1, now);
            } else {
                existing.count++;
                return existing;
            }
        });

        return attempt.count <= MAX_ATTEMPTS;
    }

    public void reset(String key) {
        attempts.remove(key);
    }

    private static class ClientAttempt {
        int count;
        long firstAttemptTime;

        ClientAttempt(int count, long firstAttemptTime) {
            this.count = count;
            this.firstAttemptTime = firstAttemptTime;
        }
    }
}
