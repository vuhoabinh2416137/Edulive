package com.edulive.dto.quiz;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizStatisticsResponse {
    private Long quizId;
    private String quizTitle;
    private Integer totalAttempts;
    private Integer uniqueParticipants;
    private BigDecimal averageScore;
    private BigDecimal highestScore;
    private BigDecimal lowestScore;
    private Integer passCount;
    private BigDecimal passRatePercent;
    private List<QuizAttemptItemResponse> attempts;
}
