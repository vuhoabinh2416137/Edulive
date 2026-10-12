package com.edulive.dto.enrollment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseProgressResponse {
    private Long courseId;
    private Long enrollmentId;
    private BigDecimal progressPercent;
    private Long totalLessons;
    private Long completedLessons;

    @Builder.Default
    private List<Long> completedLessonIds = new ArrayList<>();
}
