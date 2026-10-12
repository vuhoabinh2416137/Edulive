package com.edulive.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentDashboardResponse {
    private Long enrolledCoursesCount;
    private Long completedCoursesCount;
    private Long inProgressCoursesCount;
    private Long quizzesAttemptedCount;
    private Long passedQuizzesCount;
    private BigDecimal averageQuizScore;
    private Long totalLessonsCompleted;

    private List<RecentCourseProgress> recentCourses;
    private List<RecentQuizAttemptSummary> recentQuizAttempts;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecentCourseProgress {
        private Long id;
        private String title;
        private String slug;
        private String thumbnailUrl;
        private Integer progressPercent;
        private Instant lastAccessedAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecentQuizAttemptSummary {
        private Long id;
        private Long quizId;
        private String quizTitle;
        private BigDecimal score;
        private Boolean passed;
        private Instant submittedAt;
    }
}
