package com.edulive.dto.quiz;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewOptionResponse {
    private Long id;
    private String optionText;
    private Boolean isCorrect;
    private Boolean isSelectedByUser;
    private Integer orderIndex;
}
