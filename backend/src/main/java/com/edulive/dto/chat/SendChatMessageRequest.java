package com.edulive.dto.chat;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SendChatMessageRequest {
    @NotBlank(message = "Nội dung tin nhắn không được để trống")
    private String content;
}
