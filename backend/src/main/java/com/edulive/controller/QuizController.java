package com.edulive.controller;

import com.edulive.dto.quiz.*;
import com.edulive.security.UserPrincipal;
import com.edulive.service.QuizService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Tag(name = "Quiz", description = "Các API tạo bài trắc nghiệm, làm bài, chấm điểm tự động và thống kê")
public class QuizController {

    private final QuizService quizService;

    @GetMapping("/courses/{courseId}/quizzes")
    @Operation(summary = "Danh sách bài trắc nghiệm trong khóa học", description = "Lấy danh sách các bài thi trắc nghiệm kèm tiến độ làm bài của học viên hiện tại")
    public ResponseEntity<List<QuizSummaryResponse>> getQuizzesByCourse(
            @PathVariable Long courseId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        Long userId = currentUser != null ? currentUser.getId() : null;
        return ResponseEntity.ok(quizService.getQuizzesByCourse(courseId, userId));
    }

    @PostMapping("/courses/{courseId}/quizzes")
    @PreAuthorize("hasAnyRole('LECTURER', 'ADMIN')")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "Tạo bài trắc nghiệm mới", description = "Giảng viên hoặc Admin tạo bài trắc nghiệm kèm các câu hỏi")
    public ResponseEntity<QuizDetailResponse> createQuiz(
            @PathVariable Long courseId,
            @Valid @RequestBody CreateQuizRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        request.setCourseId(courseId);
        QuizDetailResponse response = quizService.createQuiz(currentUser.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/quizzes/{id}")
    @Operation(summary = "Chi tiết bài trắc nghiệm", description = "Lấy chi tiết bài thi trắc nghiệm (ẩn đáp án đúng đối với học viên)")
    public ResponseEntity<QuizDetailResponse> getQuizById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        Long userId = currentUser != null ? currentUser.getId() : null;
        boolean isTeacherOrAdmin = currentUser != null && currentUser.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_LECTURER") || a.getAuthority().equals("ROLE_ADMIN"));
        return ResponseEntity.ok(quizService.getQuizById(id, userId, isTeacherOrAdmin));
    }

    @PutMapping("/quizzes/{id}")
    @PreAuthorize("hasAnyRole('LECTURER', 'ADMIN')")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "Cập nhật bài trắc nghiệm", description = "Cập nhật tiêu đề, thời gian làm bài, số lần thi tối đa và điểm đạt")
    public ResponseEntity<QuizDetailResponse> updateQuiz(
            @PathVariable Long id,
            @Valid @RequestBody UpdateQuizRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(quizService.updateQuiz(id, currentUser.getId(), request));
    }

    @DeleteMapping("/quizzes/{id}")
    @PreAuthorize("hasAnyRole('LECTURER', 'ADMIN')")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "Xóa bài trắc nghiệm", description = "Xóa bài thi trắc nghiệm và toàn bộ câu hỏi liên quan")
    public ResponseEntity<Void> deleteQuiz(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        quizService.deleteQuiz(id, currentUser.getId());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/quizzes/{id}/questions")
    @PreAuthorize("hasAnyRole('LECTURER', 'ADMIN')")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "Thêm câu hỏi vào bài trắc nghiệm", description = "Thêm một câu hỏi mới và các lựa chọn đáp án")
    public ResponseEntity<QuestionResponse> addQuestion(
            @PathVariable Long id,
            @Valid @RequestBody CreateQuestionRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED).body(quizService.addQuestion(id, currentUser.getId(), request));
    }

    @DeleteMapping("/quizzes/questions/{questionId}")
    @PreAuthorize("hasAnyRole('LECTURER', 'ADMIN')")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "Xóa câu hỏi khỏi bài trắc nghiệm", description = "Xóa câu hỏi và các lựa chọn liên quan")
    public ResponseEntity<Void> deleteQuestion(
            @PathVariable Long questionId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        quizService.deleteQuestion(questionId, currentUser.getId());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/quizzes/{id}/start")
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "Bắt đầu làm bài trắc nghiệm", description = "Tạo một lượt thi mới, tính thời gian hết hạn và trả về đề thi đã ẩn đáp án đúng")
    public ResponseEntity<StartQuizResponse> startQuiz(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED).body(quizService.startQuiz(id, currentUser.getId()));
    }

    @PostMapping("/quizzes/attempts/{attemptId}/submit")
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "Nộp bài trắc nghiệm", description = "Hệ thống tự động chấm điểm trên server, so khớp đáp án và trả về kết quả thi chi tiết")
    public ResponseEntity<QuizResultResponse> submitQuiz(
            @PathVariable Long attemptId,
            @Valid @RequestBody SubmitQuizRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(quizService.submitQuiz(attemptId, currentUser.getId(), request));
    }

    @GetMapping("/quizzes/attempts/{attemptId}/result")
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "Xem kết quả bài thi", description = "Xem điểm số, đánh giá Đạt/Không đạt, chi tiết từng câu đúng/sai kèm lời giải thích")
    public ResponseEntity<QuizResultResponse> getAttemptResult(
            @PathVariable Long attemptId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(quizService.getAttemptResult(attemptId, currentUser.getId()));
    }

    @GetMapping("/quizzes/{id}/statistics")
    @PreAuthorize("hasAnyRole('LECTURER', 'ADMIN')")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "Thống kê kết quả bài thi", description = "Giảng viên xem phổ điểm, điểm cao nhất, điểm trung bình và danh sách thí sinh nộp bài")
    public ResponseEntity<QuizStatisticsResponse> getQuizStatistics(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(quizService.getQuizStatistics(id, currentUser.getId()));
    }

    @GetMapping("/quizzes/{id}/export-csv")
    @PreAuthorize("hasAnyRole('LECTURER', 'ADMIN')")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "Xuất danh sách điểm thi ra file CSV", description = "Tải file CSV danh sách kết quả thi hỗ trợ tiếng Việt có dấu cho Excel")
    public ResponseEntity<byte[]> exportQuizCsv(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        byte[] csvData = quizService.exportQuizCsv(id, currentUser.getId());
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"quiz_" + id + "_results.csv\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(csvData);
    }
}
