package com.edulive.dto.enrollment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EnrollmentResponse {
    private Long id;
    private Long courseId;
    private String courseTitle;
    private String courseSlug;
    private String courseThumbnail;
    private String categoryName;
    private String lecturerName;
    private String classCode;
    private BigDecimal progressPercent;
    private Long totalLessons;
    private Long completedLessons;
    private Instant enrolledAt;
    private Instant completedAt;
}
