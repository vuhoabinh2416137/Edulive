package com.edulive.dto.quiz;

import com.edulive.entity.QuestionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
public class CreateQuestionRequest {
    @NotBlank(message = "Nội dung câu hỏi không được để trống")
    private String questionText;

    private QuestionType questionType;

    private String explanation;

    private BigDecimal points;

    private Integer orderIndex;

    private List<CreateOptionRequest> options;
}
