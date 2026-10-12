package com.edulive.dto.discussion;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateDiscussionRequest {
    private Long lessonId;

    @NotBlank(message = "Tiêu đề thảo luận không được để trống")
    private String title;

    @NotBlank(message = "Nội dung thảo luận không được để trống")
    private String content;
}
