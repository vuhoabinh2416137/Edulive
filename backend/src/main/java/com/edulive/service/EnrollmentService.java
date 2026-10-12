package com.edulive.service;

import com.edulive.dto.enrollment.CourseProgressResponse;
import com.edulive.dto.enrollment.EnrollmentResponse;
import com.edulive.dto.enrollment.JoinCourseRequest;
import com.edulive.entity.Course;
import com.edulive.entity.Enrollment;
import com.edulive.entity.Lesson;
import com.edulive.entity.LessonCompletion;
import com.edulive.entity.User;
import com.edulive.exception.AppException;
import com.edulive.exception.ResourceNotFoundException;
import com.edulive.repository.CourseRepository;
import com.edulive.repository.EnrollmentRepository;
import com.edulive.repository.LessonCompletionRepository;
import com.edulive.repository.LessonRepository;
import com.edulive.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class EnrollmentService {

    private final EnrollmentRepository enrollmentRepository;
    private final CourseRepository courseRepository;
    private final LessonRepository lessonRepository;
    private final LessonCompletionRepository lessonCompletionRepository;
    private final UserRepository userRepository;

    @Transactional
    public EnrollmentResponse joinCourse(JoinCourseRequest request, Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("Người dùng", "id", userId));

        Course course;
        if (request.getClassCode() != null && !request.getClassCode().isBlank()) {
            String code = request.getClassCode().trim().toUpperCase();
            course = courseRepository.findByClassCode(code)
                .orElseThrow(() -> new AppException("Mã lớp học không tồn tại hoặc không hợp lệ: " + code, HttpStatus.NOT_FOUND));
        } else if (request.getCourseId() != null) {
            course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException("Khóa học", "id", request.getCourseId()));
        } else {
            throw new AppException("Vui lòng cung cấp mã lớp học hoặc ID khóa học", HttpStatus.BAD_REQUEST);
        }

        Enrollment enrollment = enrollmentRepository.findByUserIdAndCourseId(userId, course.getId())
            .orElseGet(() -> {
                Enrollment newEnrollment = Enrollment.builder()
                    .user(user)
                    .course(course)
                    .progressPercent(BigDecimal.ZERO)
                    .build();
                return enrollmentRepository.save(newEnrollment);
            });

        return toEnrollmentResponse(enrollment);
    }

    @Transactional(readOnly = true)
    public List<EnrollmentResponse> getMyCourses(Long userId) {
        return enrollmentRepository.findByUserIdWithCourse(userId).stream()
            .map(this::toEnrollmentResponse)
            .collect(Collectors.toList());
    }

    @Transactional
    public CourseProgressResponse completeLesson(Long courseId, Long lessonId, Long userId) {
        Enrollment enrollment = enrollmentRepository.findByUserIdAndCourseId(userId, courseId)
            .orElseThrow(() -> new AppException("Bạn chưa đăng ký tham gia khóa học này", HttpStatus.FORBIDDEN));

        Lesson lesson = lessonRepository.findById(lessonId)
            .orElseThrow(() -> new ResourceNotFoundException("Bài học", "id", lessonId));

        if (!lesson.getChapter().getCourse().getId().equals(courseId)) {
            throw new AppException("Bài học không thuộc về khóa học này", HttpStatus.BAD_REQUEST);
        }

        if (!lessonCompletionRepository.existsByEnrollmentIdAndLessonId(enrollment.getId(), lessonId)) {
            LessonCompletion completion = LessonCompletion.builder()
                .enrollment(enrollment)
                .lesson(lesson)
                .build();
            lessonCompletionRepository.save(completion);
        }

        long totalLessons = lessonRepository.countByCourseId(courseId);
        long completedLessons = lessonCompletionRepository.countByEnrollmentId(enrollment.getId());

        BigDecimal progress = BigDecimal.ZERO;
        if (totalLessons > 0) {
            progress = BigDecimal.valueOf((completedLessons * 100.0) / totalLessons)
                .setScale(2, RoundingMode.HALF_UP);
            if (progress.compareTo(BigDecimal.valueOf(100.0)) > 0) {
                progress = BigDecimal.valueOf(100.0);
            }
        }

        enrollment.setProgressPercent(progress);
        if (completedLessons >= totalLessons && totalLessons > 0) {
            enrollment.setCompletedAt(Instant.now());
        }
        enrollmentRepository.save(enrollment);

        List<Long> completedIds = lessonCompletionRepository.findCompletedLessonIdsByEnrollmentId(enrollment.getId());

        return CourseProgressResponse.builder()
            .courseId(courseId)
            .enrollmentId(enrollment.getId())
            .progressPercent(progress)
            .totalLessons(totalLessons)
            .completedLessons(completedLessons)
            .completedLessonIds(completedIds)
            .build();
    }

    @Transactional(readOnly = true)
    public CourseProgressResponse getCourseProgress(Long courseId, Long userId) {
        Enrollment enrollment = enrollmentRepository.findByUserIdAndCourseId(userId, courseId)
            .orElseThrow(() -> new AppException("Bạn chưa đăng ký tham gia khóa học này", HttpStatus.FORBIDDEN));

        long totalLessons = lessonRepository.countByCourseId(courseId);
        long completedLessons = lessonCompletionRepository.countByEnrollmentId(enrollment.getId());
        List<Long> completedIds = lessonCompletionRepository.findCompletedLessonIdsByEnrollmentId(enrollment.getId());

        return CourseProgressResponse.builder()
            .courseId(courseId)
            .enrollmentId(enrollment.getId())
            .progressPercent(enrollment.getProgressPercent())
            .totalLessons(totalLessons)
            .completedLessons(completedLessons)
            .completedLessonIds(completedIds)
            .build();
    }

    private EnrollmentResponse toEnrollmentResponse(Enrollment e) {
        long totalLessons = lessonRepository.countByCourseId(e.getCourse().getId());
        long completedLessons = lessonCompletionRepository.countByEnrollmentId(e.getId());

        return EnrollmentResponse.builder()
            .id(e.getId())
            .courseId(e.getCourse().getId())
            .courseTitle(e.getCourse().getTitle())
            .courseSlug(e.getCourse().getSlug())
            .courseThumbnail(e.getCourse().getThumbnailUrl())
            .categoryName(e.getCourse().getCategory() != null ? e.getCourse().getCategory().getName() : "")
            .lecturerName(e.getCourse().getLecturer().getFullName())
            .classCode(e.getCourse().getClassCode())
            .progressPercent(e.getProgressPercent())
            .totalLessons(totalLessons)
            .completedLessons(completedLessons)
            .enrolledAt(e.getEnrolledAt())
            .completedAt(e.getCompletedAt())
            .build();
    }
}
