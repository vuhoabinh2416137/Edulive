package com.edulive.controller;

import com.edulive.dto.course.*;
import com.edulive.entity.CourseStatus;
import com.edulive.entity.Role;
import com.edulive.security.UserPrincipal;
import com.edulive.service.CourseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/courses")
@RequiredArgsConstructor
@Tag(name = "Courses", description = "Các endpoint quản lý khóa học, chương và bài giảng")
public class CourseController {

    private final CourseService courseService;

    @GetMapping
    @Operation(summary = "Tìm kiếm và phân trang khóa học", description = "Lọc khóa học theo từ khóa, danh mục hoặc trạng thái")
    public ResponseEntity<Page<CourseSummaryResponse>> searchCourses(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false, defaultValue = "PUBLISHED") CourseStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        Sort sort = direction.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Long userId = currentUser != null ? currentUser.getId() : null;

        Page<CourseSummaryResponse> result = courseService.searchCourses(keyword, categoryId, status, pageable, userId);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết khóa học theo ID", description = "Trả về thông tin chi tiết khóa học, danh sách chương và bài giảng")
    public ResponseEntity<CourseDetailResponse> getCourseDetail(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        Long userId = currentUser != null ? currentUser.getId() : null;
        return ResponseEntity.ok(courseService.getCourseDetail(id, userId));
    }

    @GetMapping("/slug/{slug}")
    @Operation(summary = "Lấy chi tiết khóa học theo Slug", description = "Dành cho URL thân thiện người dùng trên frontend")
    public ResponseEntity<CourseDetailResponse> getCourseDetailBySlug(
            @PathVariable String slug,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        Long userId = currentUser != null ? currentUser.getId() : null;
        return ResponseEntity.ok(courseService.getCourseDetailBySlug(slug, userId));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('LECTURER', 'ADMIN')")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "Tạo khóa học mới", description = "Chỉ Giảng viên hoặc Quản trị viên được tạo khóa học")
    public ResponseEntity<CourseSummaryResponse> createCourse(
            @Valid @RequestBody CreateCourseRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        CourseSummaryResponse response = courseService.createCourse(request, currentUser.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('LECTURER', 'ADMIN')")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "Cập nhật khóa học", description = "Giảng viên sở hữu hoặc Admin mới có quyền cập nhật")
    public ResponseEntity<CourseSummaryResponse> updateCourse(
            @PathVariable Long id,
            @Valid @RequestBody UpdateCourseRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        boolean isAdmin = currentUser.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_" + Role.ADMIN.name()));
        CourseSummaryResponse response = courseService.updateCourse(id, request, currentUser.getId(), isAdmin);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('LECTURER', 'ADMIN')")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "Xóa khóa học", description = "Giảng viên sở hữu hoặc Admin mới có quyền xóa")
    public ResponseEntity<Map<String, String>> deleteCourse(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        boolean isAdmin = currentUser.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_" + Role.ADMIN.name()));
        courseService.deleteCourse(id, currentUser.getId(), isAdmin);
        return ResponseEntity.ok(Map.of("message", "Xóa khóa học thành công"));
    }

    // --- Chapters ---

    @PostMapping("/{courseId}/chapters")
    @PreAuthorize("hasAnyRole('LECTURER', 'ADMIN')")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "Tạo chương học mới")
    public ResponseEntity<ChapterResponse> createChapter(
            @PathVariable Long courseId,
            @Valid @RequestBody ChapterRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        boolean isAdmin = currentUser.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_" + Role.ADMIN.name()));
        ChapterResponse response = courseService.createChapter(courseId, request, currentUser.getId(), isAdmin);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/chapters/{chapterId}")
    @PreAuthorize("hasAnyRole('LECTURER', 'ADMIN')")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "Cập nhật chương học")
    public ResponseEntity<ChapterResponse> updateChapter(
            @PathVariable Long chapterId,
            @Valid @RequestBody ChapterRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        boolean isAdmin = currentUser.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_" + Role.ADMIN.name()));
        ChapterResponse response = courseService.updateChapter(chapterId, request, currentUser.getId(), isAdmin);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/chapters/{chapterId}")
    @PreAuthorize("hasAnyRole('LECTURER', 'ADMIN')")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "Xóa chương học")
    public ResponseEntity<Map<String, String>> deleteChapter(
            @PathVariable Long chapterId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        boolean isAdmin = currentUser.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_" + Role.ADMIN.name()));
        courseService.deleteChapter(chapterId, currentUser.getId(), isAdmin);
        return ResponseEntity.ok(Map.of("message", "Xóa chương học thành công"));
    }

    // --- Lessons ---

    @PostMapping("/chapters/{chapterId}/lessons")
    @PreAuthorize("hasAnyRole('LECTURER', 'ADMIN')")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "Thêm bài học mới vào chương")
    public ResponseEntity<LessonResponse> createLesson(
            @PathVariable Long chapterId,
            @Valid @RequestBody LessonRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        boolean isAdmin = currentUser.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_" + Role.ADMIN.name()));
        LessonResponse response = courseService.createLesson(chapterId, request, currentUser.getId(), isAdmin);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/lessons/{lessonId}")
    @PreAuthorize("hasAnyRole('LECTURER', 'ADMIN')")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "Cập nhật bài học")
    public ResponseEntity<LessonResponse> updateLesson(
            @PathVariable Long lessonId,
            @Valid @RequestBody LessonRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        boolean isAdmin = currentUser.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_" + Role.ADMIN.name()));
        LessonResponse response = courseService.updateLesson(lessonId, request, currentUser.getId(), isAdmin);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/lessons/{lessonId}")
    @PreAuthorize("hasAnyRole('LECTURER', 'ADMIN')")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "Xóa bài học")
    public ResponseEntity<Map<String, String>> deleteLesson(
            @PathVariable Long lessonId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        boolean isAdmin = currentUser.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_" + Role.ADMIN.name()));
        courseService.deleteLesson(lessonId, currentUser.getId(), isAdmin);
        return ResponseEntity.ok(Map.of("message", "Xóa bài học thành công"));
    }

    @GetMapping("/lessons/{lessonId}")
    @Operation(summary = "Lấy chi tiết một bài học")
    public ResponseEntity<LessonResponse> getLesson(
            @PathVariable Long lessonId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        Long userId = currentUser != null ? currentUser.getId() : null;
        return ResponseEntity.ok(courseService.getLesson(lessonId, userId));
    }
}
