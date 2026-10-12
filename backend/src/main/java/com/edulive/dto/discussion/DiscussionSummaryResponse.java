package com.edulive.dto.discussion;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DiscussionSummaryResponse {
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
    private Integer commentCount;
    private Boolean hasAcceptedAnswer;
}
