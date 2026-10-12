package com.edulive.dto.webrtc;

import com.edulive.dto.discussion.AuthorDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VideoRoomResponse {
    private Long id;
    private Long courseId;
    private String courseTitle;
    private AuthorDto host;
    private String roomCode;
    private String title;
    private Boolean isActive;
    private Boolean isLive;
    private Long hostId;
    private String hostName;
    private Instant scheduledAt;
    private Instant createdAt;
}
