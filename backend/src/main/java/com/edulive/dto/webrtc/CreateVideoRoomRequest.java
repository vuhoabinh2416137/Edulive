package com.edulive.dto.webrtc;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateVideoRoomRequest {
    @NotNull(message = "ID khóa học không được để trống")
    private Long courseId;

    @NotBlank(message = "Tiêu đề phòng học không được để trống")
    private String title;

    private Instant scheduledAt;
}
