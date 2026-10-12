package com.edulive.dto.quiz;

import com.edulive.entity.QuestionType;
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
public class ReviewAnswerResponse {
    private Long questionId;
    private String questionText;
    private QuestionType questionType;
    private BigDecimal points;
    private BigDecimal earnedPoints;
    private Boolean isCorrect;
    private List<Long> selectedOptionIds;
    private List<ReviewOptionResponse> options;
    private String explanation;
}
