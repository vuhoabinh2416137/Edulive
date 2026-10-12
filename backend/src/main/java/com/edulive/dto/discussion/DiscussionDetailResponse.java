package com.edulive.dto.discussion;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DiscussionDetailResponse {
    private Long id;
    private Long courseId;
    private Long lessonId;
    private String lessonTitle;
    private String title;
    private String content;
    private Boolean isPinned;
    private Instant createdAt;
    private Instant updatedAt;
    private AuthorDto author;
    @Builder.Default
    private List<CommentResponse> comments = new ArrayList<>();
}
