package com.edulive.dto.quiz;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateOptionRequest {
    @NotBlank(message = "Nội dung lựa chọn không được để trống")
    private String optionText;

    private Boolean isCorrect;

    private Integer orderIndex;
}
