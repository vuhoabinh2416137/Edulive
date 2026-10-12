package com.edulive.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class HelloController {

    @GetMapping("/hello")
    public ResponseEntity<Map<String, Object>> hello() {
        return ResponseEntity.ok(Map.of(
            "status", "success",
            "message", "EduLive Backend API is running successfully!",
            "version", "1.0.0",
            "timestamp", System.currentTimeMillis()
        ));
    }
}
