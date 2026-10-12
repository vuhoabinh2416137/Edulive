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
public class TakingQuestionResponse {
    private Long id;
    private String questionText;
    private QuestionType questionType;
    private BigDecimal points;
    private Integer orderIndex;
    private List<TakingOptionResponse> options;
}
