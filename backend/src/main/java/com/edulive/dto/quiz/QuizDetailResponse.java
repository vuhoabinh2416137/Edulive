package com.edulive.dto.quiz;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizDetailResponse {
    private Long id;
    private Long courseId;
    private String courseTitle;
    private Long chapterId;
    private String chapterTitle;
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
    private List<QuestionResponse> questions;
}
