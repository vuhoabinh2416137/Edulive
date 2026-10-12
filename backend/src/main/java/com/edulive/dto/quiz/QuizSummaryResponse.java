package com.edulive.dto.quiz;

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
public class QuizSummaryResponse {
    private Long id;
    private Long courseId;
    private Long chapterId;
    private String title;
    private String description;
    private Integer timeLimitMinutes;
    private Integer maxAttempts;
    private BigDecimal passingScore;
    private Integer questionCount;
    private BigDecimal totalPoints;
    private Integer myAttemptsCount;
    private BigDecimal myHighestScore;
    private Boolean myPassed;
    private Instant createdAt;
}
