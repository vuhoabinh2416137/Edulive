package com.edulive;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import static org.junit.jupiter.api.Assertions.assertTrue;

public class PasswordGeneratorTest {

    @Test
    void generatePasswordHash() {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String raw = "Password@123";
        String encoded = encoder.encode(raw);
        System.out.println(">>> GENERATED BCRYPT HASH: " + encoded);
        assertTrue(encoder.matches(raw, encoded));
    }
}
