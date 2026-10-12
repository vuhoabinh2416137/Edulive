package com.edulive.controller;

import com.edulive.dto.response.NotificationResponse;
import com.edulive.security.UserPrincipal;
import com.edulive.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@Tag(name = "Notification", description = "Các API Thông báo thời gian thực")
@SecurityRequirement(name = "Bearer Authentication")
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    @Operation(summary = "Lấy danh sách thông báo gần đây", description = "Lấy tối đa 20 thông báo mới nhất của người dùng")
    public ResponseEntity<List<NotificationResponse>> getRecentNotifications(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(notificationService.getRecentNotifications(currentUser.getId()));
    }

    @GetMapping("/page")
    @Operation(summary = "Lấy danh sách thông báo phân trang")
    public ResponseEntity<Page<NotificationResponse>> getNotificationsPaged(
            @PageableDefault(size = 10) Pageable pageable,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(notificationService.getNotifications(currentUser.getId(), pageable));
    }

    @GetMapping("/unread-count")
    @Operation(summary = "Số lượng thông báo chưa đọc")
    public ResponseEntity<Map<String, Long>> getUnreadCount(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        long count = notificationService.getUnreadCount(currentUser.getId());
        return ResponseEntity.ok(Map.of("unreadCount", count));
    }

    @PatchMapping("/{id}/read")
    @Operation(summary = "Đánh dấu thông báo đã đọc")
    public ResponseEntity<NotificationResponse> markAsRead(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(notificationService.markAsRead(id, currentUser.getId()));
    }

    @PatchMapping("/read-all")
    @Operation(summary = "Đánh dấu tất cả thông báo đã đọc")
    public ResponseEntity<Map<String, String>> markAllAsRead(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        notificationService.markAllAsRead(currentUser.getId());
        return ResponseEntity.ok(Map.of("message", "Đã đánh dấu tất cả thông báo là đã đọc"));
    }
}
