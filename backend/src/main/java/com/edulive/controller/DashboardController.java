package com.edulive.controller;

import com.edulive.dto.dashboard.LecturerDashboardResponse;
import com.edulive.dto.dashboard.StudentDashboardResponse;
import com.edulive.security.UserPrincipal;
import com.edulive.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
@Tag(name = "Dashboard", description = "Các API Thống kê & Báo cáo tổng quan")
@SecurityRequirement(name = "Bearer Authentication")
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/student")
    @Operation(summary = "Thống kê tổng quan học viên", description = "Báo cáo tiến độ học tập, bài thi trắc nghiệm và khóa học đang học")
    public ResponseEntity<StudentDashboardResponse> getStudentDashboard(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(dashboardService.getStudentDashboard(currentUser.getId()));
    }

    @GetMapping("/lecturer")
    @PreAuthorize("hasAnyRole('LECTURER', 'ADMIN')")
    @Operation(summary = "Thống kê tổng quan giảng viên", description = "Báo cáo số lượng học viên, điểm số trung bình và khóa học nổi bật")
    public ResponseEntity<LecturerDashboardResponse> getLecturerDashboard(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(dashboardService.getLecturerDashboard(currentUser.getId()));
    }
}
