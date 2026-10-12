package com.edulive.controller;

import com.edulive.dto.course.CategoryResponse;
import com.edulive.service.CourseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/categories")
@RequiredArgsConstructor
@Tag(name = "Categories", description = "Các endpoint danh mục khóa học")
public class CategoryController {

    private final CourseService courseService;

    @GetMapping
    @Operation(summary = "Lấy danh sách tất cả danh mục", description = "Trả về danh sách danh mục khóa học công khai")
    public ResponseEntity<List<CategoryResponse>> getAllCategories() {
        return ResponseEntity.ok(courseService.getAllCategories());
    }
}
