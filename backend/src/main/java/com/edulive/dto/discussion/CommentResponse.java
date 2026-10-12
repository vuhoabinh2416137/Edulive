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
public class CommentResponse {
    private Long id;
    private Long discussionId;
    private Long parentId;
    private String content;
    private Boolean isAcceptedAnswer;
    private Instant createdAt;
    private AuthorDto author;
    @Builder.Default
    private List<CommentResponse> replies = new ArrayList<>();
}
