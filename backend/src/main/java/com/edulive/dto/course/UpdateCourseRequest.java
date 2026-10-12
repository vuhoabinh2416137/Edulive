package com.edulive.dto.course;

import com.edulive.entity.CourseStatus;
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
public class UpdateCourseRequest {

    @NotBlank(message = "Tiêu đề khóa học không được để trống")
    @Size(max = 200, message = "Tiêu đề khóa học không quá 200 ký tự")
    private String title;

    private String description;

    private String thumbnailUrl;

    @NotNull(message = "Danh mục không được để trống")
    private Long categoryId;

    private CourseStatus status;
}
