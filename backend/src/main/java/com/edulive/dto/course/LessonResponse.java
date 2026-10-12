package com.edulive.dto.course;

import com.edulive.entity.LessonType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LessonResponse {
    private Long id;
    private Long chapterId;
    private String title;
    private LessonType contentType;
    private String contentUrl;
    private Integer durationSeconds;
    private Integer orderIndex;
    private Boolean isCompleted;
}
