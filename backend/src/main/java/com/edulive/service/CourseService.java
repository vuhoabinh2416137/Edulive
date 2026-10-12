package com.edulive.service;

import com.edulive.dto.course.*;
import com.edulive.dto.user.UserResponse;
import com.edulive.entity.*;
import com.edulive.exception.AppException;
import com.edulive.exception.ResourceNotFoundException;
import com.edulive.mapper.UserMapper;
import com.edulive.repository.*;
import com.edulive.util.SlugUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CourseService {

    private final CourseRepository courseRepository;
    private final CategoryRepository categoryRepository;
    private final ChapterRepository chapterRepository;
    private final LessonRepository lessonRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final LessonCompletionRepository lessonCompletionRepository;
    private final UserRepository userRepository;
    private final UserMapper userMapper;

    private static final String CLASS_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    @Transactional(readOnly = true)
    public List<CategoryResponse> getAllCategories() {
        return categoryRepository.findAll().stream()
            .map(c -> CategoryResponse.builder()
                .id(c.getId())
                .name(c.getName())
                .slug(c.getSlug())
                .description(c.getDescription())
                .courseCount(0L)
                .build())
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<CourseSummaryResponse> searchCourses(
            String keyword, Long categoryId, CourseStatus status, Pageable pageable, Long currentUserId) {

        Page<Course> page = courseRepository.searchCourses(keyword, categoryId, status, pageable);

        Set<Long> enrolledCourseIds = new HashSet<>();
        if (currentUserId != null) {
            enrollmentRepository.findByUserIdWithCourse(currentUserId)
                .forEach(e -> enrolledCourseIds.add(e.getCourse().getId()));
        }

        List<CourseSummaryResponse> responses = page.getContent().stream()
            .map(c -> toSummaryResponse(c, enrolledCourseIds.contains(c.getId())))
            .collect(Collectors.toList());

        return new PageImpl<>(responses, pageable, page.getTotalElements());
    }

    @Transactional(readOnly = true)
    public CourseDetailResponse getCourseDetail(Long courseId, Long currentUserId) {
        Course course = courseRepository.findById(courseId)
            .orElseThrow(() -> new ResourceNotFoundException("Khóa học", "id", courseId));
        return buildCourseDetailResponse(course, currentUserId);
    }

    @Transactional(readOnly = true)
    public CourseDetailResponse getCourseDetailBySlug(String slug, Long currentUserId) {
        Course course = courseRepository.findBySlug(slug)
            .orElseThrow(() -> new ResourceNotFoundException("Khóa học", "slug", slug));
        return buildCourseDetailResponse(course, currentUserId);
    }

    @Transactional
    public CourseSummaryResponse createCourse(CreateCourseRequest request, Long lecturerId) {
        User lecturer = userRepository.findById(lecturerId)
            .orElseThrow(() -> new ResourceNotFoundException("Giảng viên", "id", lecturerId));

        Category category = categoryRepository.findById(request.getCategoryId())
            .orElseThrow(() -> new ResourceNotFoundException("Danh mục", "id", request.getCategoryId()));

        String baseSlug = SlugUtils.toSlug(request.getTitle());
        String slug = baseSlug;
        int counter = 1;
        while (courseRepository.existsBySlug(slug)) {
            slug = baseSlug + "-" + counter++;
        }

        String classCode = generateUniqueClassCode();

        Course course = Course.builder()
            .title(request.getTitle().trim())
            .slug(slug)
            .description(request.getDescription())
            .thumbnailUrl(request.getThumbnailUrl())
            .category(category)
            .lecturer(lecturer)
            .classCode(classCode)
            .status(request.getStatus() != null ? request.getStatus() : CourseStatus.PUBLISHED)
            .build();

        Course saved = courseRepository.save(course);
        return toSummaryResponse(saved, false);
    }

    @Transactional
    public CourseSummaryResponse updateCourse(Long courseId, UpdateCourseRequest request, Long currentUserId, boolean isAdmin) {
        Course course = courseRepository.findById(courseId)
            .orElseThrow(() -> new ResourceNotFoundException("Khóa học", "id", courseId));

        validateOwnership(course, currentUserId, isAdmin);

        Category category = categoryRepository.findById(request.getCategoryId())
            .orElseThrow(() -> new ResourceNotFoundException("Danh mục", "id", request.getCategoryId()));

        course.setTitle(request.getTitle().trim());
        course.setDescription(request.getDescription());
        course.setThumbnailUrl(request.getThumbnailUrl());
        course.setCategory(category);
        if (request.getStatus() != null) {
            course.setStatus(request.getStatus());
        }

        Course updated = courseRepository.save(course);
        return toSummaryResponse(updated, false);
    }

    @Transactional
    public void deleteCourse(Long courseId, Long currentUserId, boolean isAdmin) {
        Course course = courseRepository.findById(courseId)
            .orElseThrow(() -> new ResourceNotFoundException("Khóa học", "id", courseId));

        validateOwnership(course, currentUserId, isAdmin);
        courseRepository.delete(course);
    }

    // --- Chapters ---

    @Transactional
    public ChapterResponse createChapter(Long courseId, ChapterRequest request, Long currentUserId, boolean isAdmin) {
        Course course = courseRepository.findById(courseId)
            .orElseThrow(() -> new ResourceNotFoundException("Khóa học", "id", courseId));

        validateOwnership(course, currentUserId, isAdmin);

        int orderIndex = request.getOrderIndex() != null ? request.getOrderIndex()
            : (int) chapterRepository.countByCourseId(courseId) + 1;

        Chapter chapter = Chapter.builder()
            .course(course)
            .title(request.getTitle().trim())
            .orderIndex(orderIndex)
            .build();

        Chapter saved = chapterRepository.save(chapter);
        return ChapterResponse.builder()
            .id(saved.getId())
            .courseId(course.getId())
            .title(saved.getTitle())
            .orderIndex(saved.getOrderIndex())
            .lessons(Collections.emptyList())
            .build();
    }

    @Transactional
    public ChapterResponse updateChapter(Long chapterId, ChapterRequest request, Long currentUserId, boolean isAdmin) {
        Chapter chapter = chapterRepository.findById(chapterId)
            .orElseThrow(() -> new ResourceNotFoundException("Chương học", "id", chapterId));

        validateOwnership(chapter.getCourse(), currentUserId, isAdmin);

        chapter.setTitle(request.getTitle().trim());
        if (request.getOrderIndex() != null) {
            chapter.setOrderIndex(request.getOrderIndex());
        }

        Chapter updated = chapterRepository.save(chapter);
        return ChapterResponse.builder()
            .id(updated.getId())
            .courseId(updated.getCourse().getId())
            .title(updated.getTitle())
            .orderIndex(updated.getOrderIndex())
            .lessons(Collections.emptyList())
            .build();
    }

    @Transactional
    public void deleteChapter(Long chapterId, Long currentUserId, boolean isAdmin) {
        Chapter chapter = chapterRepository.findById(chapterId)
            .orElseThrow(() -> new ResourceNotFoundException("Chương học", "id", chapterId));

        validateOwnership(chapter.getCourse(), currentUserId, isAdmin);
        chapterRepository.delete(chapter);
    }

    // --- Lessons ---

    @Transactional
    public LessonResponse createLesson(Long chapterId, LessonRequest request, Long currentUserId, boolean isAdmin) {
        Chapter chapter = chapterRepository.findById(chapterId)
            .orElseThrow(() -> new ResourceNotFoundException("Chương học", "id", chapterId));

        validateOwnership(chapter.getCourse(), currentUserId, isAdmin);

        int orderIndex = request.getOrderIndex() != null ? request.getOrderIndex()
            : chapter.getLessons().size() + 1;

        Lesson lesson = Lesson.builder()
            .chapter(chapter)
            .title(request.getTitle().trim())
            .contentType(request.getContentType())
            .contentUrl(request.getContentUrl())
            .durationSeconds(request.getDurationSeconds() != null ? request.getDurationSeconds() : 0)
            .orderIndex(orderIndex)
            .build();

        Lesson saved = lessonRepository.save(lesson);
        return toLessonResponse(saved, false);
    }

    @Transactional
    public LessonResponse updateLesson(Long lessonId, LessonRequest request, Long currentUserId, boolean isAdmin) {
        Lesson lesson = lessonRepository.findById(lessonId)
            .orElseThrow(() -> new ResourceNotFoundException("Bài học", "id", lessonId));

        validateOwnership(lesson.getChapter().getCourse(), currentUserId, isAdmin);

        lesson.setTitle(request.getTitle().trim());
        lesson.setContentType(request.getContentType());
        lesson.setContentUrl(request.getContentUrl());
        if (request.getDurationSeconds() != null) {
            lesson.setDurationSeconds(request.getDurationSeconds());
        }
        if (request.getOrderIndex() != null) {
            lesson.setOrderIndex(request.getOrderIndex());
        }

        Lesson updated = lessonRepository.save(lesson);
        return toLessonResponse(updated, false);
    }

    @Transactional
    public void deleteLesson(Long lessonId, Long currentUserId, boolean isAdmin) {
        Lesson lesson = lessonRepository.findById(lessonId)
            .orElseThrow(() -> new ResourceNotFoundException("Bài học", "id", lessonId));

        validateOwnership(lesson.getChapter().getCourse(), currentUserId, isAdmin);
        lessonRepository.delete(lesson);
    }

    @Transactional(readOnly = true)
    public LessonResponse getLesson(Long lessonId, Long currentUserId) {
        Lesson lesson = lessonRepository.findById(lessonId)
            .orElseThrow(() -> new ResourceNotFoundException("Bài học", "id", lessonId));

        boolean isCompleted = false;
        if (currentUserId != null) {
            Optional<Enrollment> enrollment = enrollmentRepository.findByUserIdAndCourseId(
                currentUserId, lesson.getChapter().getCourse().getId()
            );
            if (enrollment.isPresent()) {
                isCompleted = lessonCompletionRepository.existsByEnrollmentIdAndLessonId(
                    enrollment.get().getId(), lesson.getId()
                );
            }
        }

        return toLessonResponse(lesson, isCompleted);
    }

    // --- Helpers ---

    private CourseDetailResponse buildCourseDetailResponse(Course course, Long currentUserId) {
        boolean isEnrolled = false;
        java.math.BigDecimal progressPercent = java.math.BigDecimal.ZERO;
        Set<Long> completedLessonIds = new HashSet<>();

        if (currentUserId != null) {
            Optional<Enrollment> enrollmentOpt = enrollmentRepository.findByUserIdAndCourseId(currentUserId, course.getId());
            if (enrollmentOpt.isPresent()) {
                isEnrolled = true;
                progressPercent = enrollmentOpt.get().getProgressPercent();
                completedLessonIds.addAll(
                    lessonCompletionRepository.findCompletedLessonIdsByEnrollmentId(enrollmentOpt.get().getId())
                );
            }
        }

        List<Chapter> chapters = chapterRepository.findByCourseIdOrderByOrderIndexAsc(course.getId());
        List<ChapterResponse> chapterResponses = new ArrayList<>();
        long totalLessons = 0;
        long totalDurationSeconds = 0;

        for (Chapter chapter : chapters) {
            List<Lesson> lessons = lessonRepository.findByChapterIdOrderByOrderIndexAsc(chapter.getId());
            List<LessonResponse> lessonResponses = new ArrayList<>();

            for (Lesson l : lessons) {
                totalLessons++;
                totalDurationSeconds += (l.getDurationSeconds() != null ? l.getDurationSeconds() : 0);
                lessonResponses.add(toLessonResponse(l, completedLessonIds.contains(l.getId())));
            }

            chapterResponses.add(ChapterResponse.builder()
                .id(chapter.getId())
                .courseId(course.getId())
                .title(chapter.getTitle())
                .orderIndex(chapter.getOrderIndex())
                .lessons(lessonResponses)
                .build());
        }

        long enrolledCount = enrollmentRepository.countByCourseId(course.getId());

        CategoryResponse catRes = null;
        if (course.getCategory() != null) {
            catRes = CategoryResponse.builder()
                .id(course.getCategory().getId())
                .name(course.getCategory().getName())
                .slug(course.getCategory().getSlug())
                .description(course.getCategory().getDescription())
                .build();
        }

        UserResponse lecturerRes = userMapper.toResponse(course.getLecturer());

        return CourseDetailResponse.builder()
            .id(course.getId())
            .title(course.getTitle())
            .slug(course.getSlug())
            .description(course.getDescription())
            .thumbnailUrl(course.getThumbnailUrl())
            .category(catRes)
            .lecturer(lecturerRes)
            .classCode(course.getClassCode())
            .status(course.getStatus())
            .totalLessons(totalLessons)
            .totalDurationSeconds(totalDurationSeconds)
            .enrolledCount(enrolledCount)
            .isEnrolled(isEnrolled)
            .progressPercent(progressPercent)
            .chapters(chapterResponses)
            .createdAt(course.getCreatedAt())
            .updatedAt(course.getUpdatedAt())
            .build();
    }

    private CourseSummaryResponse toSummaryResponse(Course course, boolean isEnrolled) {
        long totalLessons = lessonRepository.countByCourseId(course.getId());
        long enrolledCount = enrollmentRepository.countByCourseId(course.getId());

        return CourseSummaryResponse.builder()
            .id(course.getId())
            .title(course.getTitle())
            .slug(course.getSlug())
            .description(course.getDescription())
            .thumbnailUrl(course.getThumbnailUrl())
            .categoryId(course.getCategory() != null ? course.getCategory().getId() : null)
            .categoryName(course.getCategory() != null ? course.getCategory().getName() : "")
            .lecturerId(course.getLecturer().getId())
            .lecturerName(course.getLecturer().getFullName())
            .lecturerAvatar(course.getLecturer().getAvatarUrl())
            .classCode(course.getClassCode())
            .status(course.getStatus())
            .totalLessons(totalLessons)
            .totalDurationSeconds(0L)
            .enrolledCount(enrolledCount)
            .isEnrolled(isEnrolled)
            .createdAt(course.getCreatedAt())
            .build();
    }

    private LessonResponse toLessonResponse(Lesson lesson, boolean isCompleted) {
        return LessonResponse.builder()
            .id(lesson.getId())
            .chapterId(lesson.getChapter().getId())
            .title(lesson.getTitle())
            .contentType(lesson.getContentType())
            .contentUrl(lesson.getContentUrl())
            .durationSeconds(lesson.getDurationSeconds())
            .orderIndex(lesson.getOrderIndex())
            .isCompleted(isCompleted)
            .build();
    }

    private void validateOwnership(Course course, Long userId, boolean isAdmin) {
        if (isAdmin) return;
        if (!course.getLecturer().getId().equals(userId)) {
            throw new AppException("Bạn không có quyền chỉnh sửa khóa học này", HttpStatus.FORBIDDEN);
        }
    }

    private String generateUniqueClassCode() {
        String code;
        do {
            StringBuilder sb = new StringBuilder(6);
            for (int i = 0; i < 6; i++) {
                sb.append(CLASS_CODE_CHARS.charAt(RANDOM.nextInt(CLASS_CODE_CHARS.length())));
            }
            code = sb.toString();
        } while (courseRepository.existsByClassCode(code));
        return code;
    }
}
