package com.edulive.dto.quiz;

import com.edulive.entity.QuizAttemptStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizAttemptItemResponse {
    private Long attemptId;
    private Long userId;
    private String userFullName;
    private String userEmail;
    private BigDecimal score;
    private Boolean isPassed;
    private QuizAttemptStatus status;
    private Instant startedAt;
    private Instant submittedAt;
    private Long durationSeconds;
}
