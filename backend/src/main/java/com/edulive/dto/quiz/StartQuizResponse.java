package com.edulive.dto.quiz;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StartQuizResponse {
    private Long attemptId;
    private Long quizId;
    private String title;
    private String description;
    private Integer timeLimitMinutes;
    private Instant startedAt;
    private Instant expiresAt;
    private List<TakingQuestionResponse> questions;
}
