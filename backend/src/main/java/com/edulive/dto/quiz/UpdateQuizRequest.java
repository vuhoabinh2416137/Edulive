package com.edulive.dto.quiz;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateQuizRequest {
    private Long chapterId;

    @NotBlank(message = "Tiêu đề bài trắc nghiệm không được để trống")
    private String title;

    private String description;

    private Integer timeLimitMinutes;

    private Integer maxAttempts;

    private BigDecimal passingScore;
}
