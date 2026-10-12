package com.edulive.service;

import com.edulive.dto.dashboard.LecturerDashboardResponse;
import com.edulive.dto.dashboard.StudentDashboardResponse;
import com.edulive.entity.*;
import com.edulive.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DashboardService {

    private final EnrollmentRepository enrollmentRepository;
    private final CourseRepository courseRepository;
    private final QuizRepository quizRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final DiscussionRepository discussionRepository;
    private final LessonCompletionRepository lessonCompletionRepository;
    private final LessonRepository lessonRepository;

    @Transactional(readOnly = true)
    public StudentDashboardResponse getStudentDashboard(Long userId) {
        List<Enrollment> enrollments = enrollmentRepository.findByUserIdWithCourse(userId);
        long enrolledCount = enrollments.size();

        long completedCourses = enrollments.stream()
                .filter(e -> e.getProgressPercent() != null && e.getProgressPercent().compareTo(BigDecimal.valueOf(100)) >= 0)
                .count();
        long inProgressCourses = enrolledCount - completedCourses;

        // Quiz attempts
        List<QuizAttempt> attempts = quizAttemptRepository.findByUserIdOrderByStartedAtDesc(userId);
        long totalAttempts = attempts.size();
        long passedCount = attempts.stream().filter(a -> Boolean.TRUE.equals(a.getIsPassed())).count();

        BigDecimal averageScore = BigDecimal.ZERO;
        if (!attempts.isEmpty()) {
            double avg = attempts.stream()
                    .filter(a -> a.getScore() != null)
                    .mapToDouble(a -> a.getScore().doubleValue())
                    .average()
                    .orElse(0.0);
            averageScore = BigDecimal.valueOf(avg).setScale(1, RoundingMode.HALF_UP);
        }

        // Total lessons completed
        long totalLessonsCompleted = 0;
        for (Enrollment e : enrollments) {
            totalLessonsCompleted += lessonCompletionRepository.countByEnrollmentId(e.getId());
        }

        // Recent courses progress
        List<StudentDashboardResponse.RecentCourseProgress> recentCourses = enrollments.stream()
                .limit(5)
                .map(e -> StudentDashboardResponse.RecentCourseProgress.builder()
                        .id(e.getCourse().getId())
                        .title(e.getCourse().getTitle())
                        .slug(e.getCourse().getSlug())
                        .thumbnailUrl(e.getCourse().getThumbnailUrl())
                        .progressPercent(e.getProgressPercent() != null ? e.getProgressPercent().intValue() : 0)
                        .lastAccessedAt(e.getEnrolledAt())
                        .build())
                .collect(Collectors.toList());

        // Recent quiz attempts
        List<StudentDashboardResponse.RecentQuizAttemptSummary> recentAttempts = attempts.stream()
                .limit(5)
                .map(a -> StudentDashboardResponse.RecentQuizAttemptSummary.builder()
                        .id(a.getId())
                        .quizId(a.getQuiz().getId())
                        .quizTitle(a.getQuiz().getTitle())
                        .score(a.getScore())
                        .passed(Boolean.TRUE.equals(a.getIsPassed()))
                        .submittedAt(a.getSubmittedAt() != null ? a.getSubmittedAt() : a.getStartedAt())
                        .build())
                .collect(Collectors.toList());

        return StudentDashboardResponse.builder()
                .enrolledCoursesCount(enrolledCount)
                .completedCoursesCount(completedCourses)
                .inProgressCoursesCount(inProgressCourses)
                .quizzesAttemptedCount(totalAttempts)
                .passedQuizzesCount(passedCount)
                .averageQuizScore(averageScore)
                .totalLessonsCompleted(totalLessonsCompleted)
                .recentCourses(recentCourses)
                .recentQuizAttempts(recentAttempts)
                .build();
    }

    @Transactional(readOnly = true)
    public LecturerDashboardResponse getLecturerDashboard(Long lecturerId) {
        List<Course> courses = courseRepository.findByLecturerId(lecturerId);
        long totalCourses = courses.size();

        long totalStudents = 0;
        long totalQuizzes = 0;
        long totalAttempts = 0;
        double sumScores = 0.0;
        long scoreCount = 0;

        List<LecturerDashboardResponse.TopCourseStat> topCourses = new ArrayList<>();

        for (Course c : courses) {
            long students = enrollmentRepository.countByCourseId(c.getId());
            totalStudents += students;

            long lessons = lessonRepository.countByCourseId(c.getId());

            topCourses.add(LecturerDashboardResponse.TopCourseStat.builder()
                    .id(c.getId())
                    .title(c.getTitle())
                    .slug(c.getSlug())
                    .thumbnailUrl(c.getThumbnailUrl())
                    .studentCount(students)
                    .lessonCount(lessons)
                    .build());

            List<Quiz> quizzes = quizRepository.findByCourseId(c.getId());
            totalQuizzes += quizzes.size();

            for (Quiz q : quizzes) {
                List<QuizAttempt> attempts = quizAttemptRepository.findByQuizIdOrderByStartedAtDesc(q.getId());
                totalAttempts += attempts.size();
                for (QuizAttempt a : attempts) {
                    if (a.getScore() != null) {
                        sumScores += a.getScore().doubleValue();
                        scoreCount++;
                    }
                }
            }
        }

        // Sắp xếp khóa học theo số học viên đông nhất
        topCourses.sort((a, b) -> Long.compare(b.getStudentCount(), a.getStudentCount()));

        BigDecimal overallAvgScore = BigDecimal.ZERO;
        if (scoreCount > 0) {
            overallAvgScore = BigDecimal.valueOf(sumScores / scoreCount).setScale(1, RoundingMode.HALF_UP);
        }

        // Lấy các câu hỏi thảo luận mới nhất trong các khóa học của giảng viên
        List<LecturerDashboardResponse.RecentDiscussionSummary> recentDiscussions = new ArrayList<>();
        for (Course c : courses) {
            List<Discussion> discussions = discussionRepository.findByCourseIdOrderByIsPinnedDescCreatedAtDesc(c.getId());
            for (Discussion d : discussions) {
                recentDiscussions.add(LecturerDashboardResponse.RecentDiscussionSummary.builder()
                        .id(d.getId())
                        .courseId(c.getId())
                        .courseTitle(c.getTitle())
                        .title(d.getTitle())
                        .authorName(d.getUser().getFullName())
                        .createdAt(d.getCreatedAt())
                        .commentCount((long) d.getComments().size())
                        .build());
            }
        }
        recentDiscussions.sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));
        List<LecturerDashboardResponse.RecentDiscussionSummary> limitedDiscussions = recentDiscussions.stream()
                .limit(6)
                .collect(Collectors.toList());

        return LecturerDashboardResponse.builder()
                .totalCoursesCount(totalCourses)
                .totalStudentsEnrolled(totalStudents)
                .totalQuizzesCount(totalQuizzes)
                .totalQuizAttemptsCount(totalAttempts)
                .overallAverageQuizScore(overallAvgScore)
                .topCourses(topCourses.stream().limit(5).collect(Collectors.toList()))
                .recentDiscussions(limitedDiscussions)
                .build();
    }
}
