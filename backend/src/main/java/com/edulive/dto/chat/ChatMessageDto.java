package com.edulive.dto.chat;

import com.edulive.entity.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageDto {
    private Long id;
    private Long courseId;
    private Long userId;
    private String userFullName;
    private String userAvatarUrl;
    private Role userRole;
    private String content;
    private Instant createdAt;
}
