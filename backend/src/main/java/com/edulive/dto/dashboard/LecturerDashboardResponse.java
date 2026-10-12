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
public class LecturerDashboardResponse {
    private Long totalCoursesCount;
    private Long totalStudentsEnrolled;
    private Long totalQuizzesCount;
    private Long totalQuizAttemptsCount;
    private BigDecimal overallAverageQuizScore;

    private List<TopCourseStat> topCourses;
    private List<RecentDiscussionSummary> recentDiscussions;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TopCourseStat {
        private Long id;
        private String title;
        private String slug;
        private String thumbnailUrl;
        private Long studentCount;
        private Long lessonCount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecentDiscussionSummary {
        private Long id;
        private Long courseId;
        private String courseTitle;
        private String title;
        private String authorName;
        private Instant createdAt;
        private Long commentCount;
    }
}
