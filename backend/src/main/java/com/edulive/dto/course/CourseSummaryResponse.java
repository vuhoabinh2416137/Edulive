package com.edulive.dto.course;

import com.edulive.entity.CourseStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseSummaryResponse {
    private Long id;
    private String title;
    private String slug;
    private String description;
    private String thumbnailUrl;
    private Long categoryId;
    private String categoryName;
    private Long lecturerId;
    private String lecturerName;
    private String lecturerAvatar;
    private String classCode;
    private CourseStatus status;
    private Long totalLessons;
    private Long totalDurationSeconds;
    private Long enrolledCount;
    private Boolean isEnrolled;
    private Instant createdAt;
}
