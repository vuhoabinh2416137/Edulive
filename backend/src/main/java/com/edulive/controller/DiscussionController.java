package com.edulive.controller;

import com.edulive.dto.discussion.*;
import com.edulive.security.UserPrincipal;
import com.edulive.service.DiscussionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Tag(name = "Discussion", description = "Các API Diễn đàn Thảo luận theo bài học và Bình luận lồng nhau")
public class DiscussionController {

    private final DiscussionService discussionService;

    @GetMapping("/courses/{courseId}/discussions")
    @Operation(summary = "Danh sách chủ đề thảo luận của khóa học", description = "Lấy danh sách các chủ đề thảo luận trong khóa học (có thể lọc theo lessonId)")
    public ResponseEntity<List<DiscussionSummaryResponse>> getDiscussions(
            @PathVariable Long courseId,
            @RequestParam(required = false) Long lessonId) {
        return ResponseEntity.ok(discussionService.getDiscussions(courseId, lessonId));
    }

    @PostMapping("/courses/{courseId}/discussions")
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "Tạo chủ đề thảo luận mới", description = "Học viên hoặc giảng viên đăng câu hỏi hoặc chủ đề thảo luận")
    public ResponseEntity<DiscussionDetailResponse> createDiscussion(
            @PathVariable Long courseId,
            @Valid @RequestBody CreateDiscussionRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        DiscussionDetailResponse response = discussionService.createDiscussion(currentUser.getId(), courseId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/discussions/{id}")
    @Operation(summary = "Chi tiết chủ đề thảo luận", description = "Xem chi tiết bài thảo luận cùng toàn bộ cây bình luận phản hồi lồng nhau")
    public ResponseEntity<DiscussionDetailResponse> getDiscussionById(@PathVariable Long id) {
        return ResponseEntity.ok(discussionService.getDiscussionById(id));
    }

    @PostMapping("/discussions/{id}/comments")
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "Gửi bình luận hoặc trả lời bình luận", description = "Gửi phản hồi cho chủ đề hoặc trả lời bình luận cấp con (truyền parentId)")
    public ResponseEntity<CommentResponse> addComment(
            @PathVariable Long id,
            @Valid @RequestBody CreateCommentRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED).body(discussionService.addComment(currentUser.getId(), id, request));
    }

    @PutMapping("/discussions/{id}/pin")
    @PreAuthorize("hasAnyRole('LECTURER', 'ADMIN')")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "Ghim hoặc bỏ ghim chủ đề thảo luận", description = "Giảng viên hoặc Admin ghim chủ đề quan trọng lên đầu danh sách")
    public ResponseEntity<Void> togglePin(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        discussionService.togglePin(currentUser.getId(), id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/discussions/comments/{commentId}/accept")
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "Đánh dấu câu trả lời được chấp nhận", description = "Tác giả chủ đề hoặc Giảng viên đánh dấu bình luận là câu trả lời chính xác")
    public ResponseEntity<Void> acceptAnswer(
            @PathVariable Long commentId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        discussionService.acceptAnswer(currentUser.getId(), commentId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/discussions/{id}")
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "Xóa chủ đề thảo luận", description = "Người tạo chủ đề hoặc Giảng viên/Admin xóa bài thảo luận")
    public ResponseEntity<Void> deleteDiscussion(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        discussionService.deleteDiscussion(currentUser.getId(), id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/discussions/comments/{commentId}")
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "Xóa bình luận", description = "Người viết bình luận hoặc Giảng viên/Admin xóa bình luận")
    public ResponseEntity<Void> deleteComment(
            @PathVariable Long commentId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        discussionService.deleteComment(currentUser.getId(), commentId);
        return ResponseEntity.noContent().build();
    }
}
