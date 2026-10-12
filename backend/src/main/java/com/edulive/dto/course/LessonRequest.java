package com.edulive.dto.course;

import com.edulive.entity.LessonType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LessonRequest {

    @NotBlank(message = "Tiêu đề bài học không được để trống")
    @Size(max = 200, message = "Tiêu đề không vượt quá 200 ký tự")
    private String title;

    @NotNull(message = "Loại bài học không được để trống")
    private LessonType contentType;

    private String contentUrl;

    @Builder.Default
    private Integer durationSeconds = 0;

    @Builder.Default
    private Integer orderIndex = 1;
}
