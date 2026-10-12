package com.edulive.dto.course;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChapterRequest {

    @NotBlank(message = "Tiêu đề chương không được để trống")
    @Size(max = 200, message = "Tiêu đề chương không vượt quá 200 ký tự")
    private String title;

    @Builder.Default
    private Integer orderIndex = 1;
}
