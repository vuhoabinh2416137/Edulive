package com.edulive.dto.course;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChapterResponse {
    private Long id;
    private Long courseId;
    private String title;
    private Integer orderIndex;

    @Builder.Default
    private List<LessonResponse> lessons = new ArrayList<>();
}
