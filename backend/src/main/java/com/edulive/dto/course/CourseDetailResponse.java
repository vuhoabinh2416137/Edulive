package com.edulive.dto.course;

import com.edulive.dto.user.UserResponse;
import com.edulive.entity.CourseStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseDetailResponse {
    private Long id;
    private String title;
    private String slug;
    private String description;
    private String thumbnailUrl;
    private CategoryResponse category;
    private UserResponse lecturer;
    private String classCode;
    private CourseStatus status;
    private Long totalLessons;
    private Long totalDurationSeconds;
    private Long enrolledCount;
    private Boolean isEnrolled;
    private BigDecimal progressPercent;

    @Builder.Default
    private List<ChapterResponse> chapters = new ArrayList<>();

    private Instant createdAt;
    private Instant updatedAt;
}
