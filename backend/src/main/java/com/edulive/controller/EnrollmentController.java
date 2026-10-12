package com.edulive.controller;

import com.edulive.dto.enrollment.CourseProgressResponse;
import com.edulive.dto.enrollment.EnrollmentResponse;
import com.edulive.dto.enrollment.JoinCourseRequest;
import com.edulive.security.UserPrincipal;
import com.edulive.service.EnrollmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/enrollments")
@RequiredArgsConstructor
@Tag(name = "Enrollments", description = "Các endpoint tham gia học và theo dõi tiến độ hoàn thành bài học")
@SecurityRequirement(name = "Bearer Authentication")
public class EnrollmentController {

    private final EnrollmentService enrollmentService;

    @PostMapping("/join")
    @Operation(summary = "Tham gia khóa học", description = "Đăng ký khóa học thông qua ID khóa học hoặc mã lớp học 6 ký tự (kiểu Google Classroom)")
    public ResponseEntity<EnrollmentResponse> joinCourse(
            @RequestBody JoinCourseRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        EnrollmentResponse response = enrollmentService.joinCourse(request, currentUser.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/my-courses")
    @Operation(summary = "Danh sách khóa học đã tham gia", description = "Trả về danh sách khóa học và tiến độ hoàn thành của học viên")
    public ResponseEntity<List<EnrollmentResponse>> getMyCourses(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(enrollmentService.getMyCourses(currentUser.getId()));
    }

    @PostMapping("/{courseId}/lessons/{lessonId}/complete")
    @Operation(summary = "Đánh dấu hoàn thành bài học", description = "Cập nhật trạng thái đã học cho bài học và tính lại % tiến độ của khóa học")
    public ResponseEntity<CourseProgressResponse> completeLesson(
            @PathVariable Long courseId,
            @PathVariable Long lessonId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        CourseProgressResponse response = enrollmentService.completeLesson(courseId, lessonId, currentUser.getId());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{courseId}/progress")
    @Operation(summary = "Lấy tiến độ khóa học", description = "Xem % tiến độ, số bài đã xong và danh sách ID bài học đã hoàn thành")
    public ResponseEntity<CourseProgressResponse> getCourseProgress(
            @PathVariable Long courseId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(enrollmentService.getCourseProgress(courseId, currentUser.getId()));
    }
}
