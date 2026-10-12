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
public class CreateCommentRequest {
    private Long parentId;

    @NotBlank(message = "Nội dung bình luận không được để trống")
    private String content;
}
