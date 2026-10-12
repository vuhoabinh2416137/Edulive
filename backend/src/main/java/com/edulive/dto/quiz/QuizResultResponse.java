package com.edulive.dto.quiz;

import com.edulive.entity.QuizAttemptStatus;
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
public class QuizResultResponse {
    private Long attemptId;
    private Long quizId;
    private String quizTitle;
    private BigDecimal score; // Thang 100
    private BigDecimal passingScore;
    private Boolean isPassed;
    private QuizAttemptStatus status;
    private BigDecimal totalPoints;
    private BigDecimal earnedPoints;
    private Integer totalQuestions;
    private Integer correctQuestionsCount;
    private Instant startedAt;
    private Instant submittedAt;
    private Long durationSeconds;
    private List<ReviewAnswerResponse> reviewQuestions;
}
