package com.edulive.dto.quiz;

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
public class CreateQuizRequest {
    @NotNull(message = "ID khóa học không được để trống")
    private Long courseId;

    private Long chapterId;

    @NotBlank(message = "Tiêu đề bài trắc nghiệm không được để trống")
    private String title;

    private String description;

    private Integer timeLimitMinutes;

    private Integer maxAttempts;

    private BigDecimal passingScore;

    private List<CreateQuestionRequest> questions;
}
