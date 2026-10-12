package com.edulive.dto.quiz;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmitAnswerRequest {
    @NotNull(message = "ID câu hỏi không được để trống")
    private Long questionId;

    private List<Long> selectedOptionIds;
}
