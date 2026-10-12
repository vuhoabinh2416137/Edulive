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
public class SubmitQuizRequest {
    @NotNull(message = "Danh sách câu trả lời không được null")
    private List<SubmitAnswerRequest> answers;
}
