package com.edulive.service;

import com.edulive.dto.course.CreateCourseRequest;
import com.edulive.dto.course.CourseDetailResponse;
import com.edulive.dto.course.CourseSummaryResponse;
import com.edulive.entity.*;
import com.edulive.mapper.UserMapper;
import com.edulive.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CourseServiceTest {

    @Mock
    private CourseRepository courseRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private ChapterRepository chapterRepository;

    @Mock
    private LessonRepository lessonRepository;

    @Mock
    private EnrollmentRepository enrollmentRepository;

    @Mock
    private LessonCompletionRepository lessonCompletionRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserMapper userMapper;

    @InjectMocks
    private CourseService courseService;

    private User sampleLecturer;
    private Category sampleCategory;
    private Course sampleCourse;

    @BeforeEach
    void setUp() {
        sampleLecturer = User.builder()
            .id(2L)
            .email("giangvien1@edulive.vn")
            .fullName("ThS. Trần Quang Vinh")
            .role(Role.LECTURER)
            .status(UserStatus.ACTIVE)
            .build();

        sampleCategory = Category.builder()
            .id(1L)
            .name("Lập trình Web")
            .slug("lap-trinh-web")
            .build();

        sampleCourse = Course.builder()
            .id(1L)
            .title("Khóa học Spring Boot")
            .slug("khoa-hoc-spring-boot")
            .category(sampleCategory)
            .lecturer(sampleLecturer)
            .classCode("FSW101")
            .status(CourseStatus.PUBLISHED)
            .createdAt(Instant.now())
            .build();
    }

    @Test
    void testCreateCourse_Success_GeneratesClassCodeAndSlug() {
        CreateCourseRequest request = CreateCourseRequest.builder()
            .title("Khóa học Spring Boot Mới")
            .description("Mô tả khóa học")
            .categoryId(1L)
            .status(CourseStatus.PUBLISHED)
            .build();

        when(userRepository.findById(2L)).thenReturn(Optional.of(sampleLecturer));
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(sampleCategory));
        when(courseRepository.existsBySlug(anyString())).thenReturn(false);
        when(courseRepository.existsByClassCode(anyString())).thenReturn(false);
        when(courseRepository.save(any(Course.class))).thenAnswer(invocation -> {
            Course c = invocation.getArgument(0);
            c.setId(10L);
            return c;
        });

        CourseSummaryResponse response = courseService.createCourse(request, 2L);

        assertNotNull(response);
        assertEquals("Khóa học Spring Boot Mới", response.getTitle());
        assertNotNull(response.getClassCode());
        assertEquals(6, response.getClassCode().length());
        assertTrue(response.getSlug().contains("khoa-hoc-spring-boot-moi"));
        verify(courseRepository, times(1)).save(any(Course.class));
    }

    @Test
    void testSearchCourses_ReturnsPage() {
        when(courseRepository.searchCourses(any(), any(), any(), any()))
            .thenReturn(new PageImpl<>(List.of(sampleCourse)));
        when(lessonRepository.countByCourseId(1L)).thenReturn(4L);
        when(enrollmentRepository.countByCourseId(1L)).thenReturn(10L);

        Page<CourseSummaryResponse> page = courseService.searchCourses(
            "Spring", 1L, CourseStatus.PUBLISHED, PageRequest.of(0, 10), null
        );

        assertNotNull(page);
        assertEquals(1, page.getTotalElements());
        assertEquals("Khóa học Spring Boot", page.getContent().get(0).getTitle());
    }

    @Test
    void testGetCourseDetail_Success() {
        when(courseRepository.findById(1L)).thenReturn(Optional.of(sampleCourse));
        when(chapterRepository.findByCourseIdOrderByOrderIndexAsc(1L)).thenReturn(Collections.emptyList());
        when(enrollmentRepository.countByCourseId(1L)).thenReturn(5L);

        CourseDetailResponse detail = courseService.getCourseDetail(1L, null);

        assertNotNull(detail);
        assertEquals(1L, detail.getId());
        assertEquals("FSW101", detail.getClassCode());
        assertFalse(detail.getIsEnrolled());
    }
}
