package com.edulive.service;

import com.edulive.dto.enrollment.CourseProgressResponse;
import com.edulive.dto.enrollment.EnrollmentResponse;
import com.edulive.dto.enrollment.JoinCourseRequest;
import com.edulive.entity.*;
import com.edulive.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EnrollmentServiceTest {

    @Mock
    private EnrollmentRepository enrollmentRepository;

    @Mock
    private CourseRepository courseRepository;

    @Mock
    private LessonRepository lessonRepository;

    @Mock
    private LessonCompletionRepository lessonCompletionRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private EnrollmentService enrollmentService;

    private User sampleStudent;
    private User sampleLecturer;
    private Course sampleCourse;
    private Chapter sampleChapter;
    private Lesson sampleLesson1;
    private Enrollment sampleEnrollment;

    @BeforeEach
    void setUp() {
        sampleStudent = User.builder()
            .id(4L)
            .email("hocvien1@edulive.vn")
            .fullName("Phạm Minh Anh")
            .role(Role.STUDENT)
            .status(UserStatus.ACTIVE)
            .build();

        sampleLecturer = User.builder()
            .id(2L)
            .email("giangvien1@edulive.vn")
            .fullName("ThS. Trần Quang Vinh")
            .role(Role.LECTURER)
            .build();

        sampleCourse = Course.builder()
            .id(1L)
            .title("Khóa học Spring Boot")
            .slug("khoa-hoc-spring-boot")
            .classCode("FSW101")
            .lecturer(sampleLecturer)
            .build();

        sampleChapter = Chapter.builder()
            .id(1L)
            .course(sampleCourse)
            .title("Chương 1")
            .build();

        sampleLesson1 = Lesson.builder()
            .id(1L)
            .chapter(sampleChapter)
            .title("Bài 1")
            .contentType(LessonType.VIDEO)
            .build();

        sampleEnrollment = Enrollment.builder()
            .id(10L)
            .user(sampleStudent)
            .course(sampleCourse)
            .progressPercent(BigDecimal.ZERO)
            .enrolledAt(Instant.now())
            .build();
    }

    @Test
    void testJoinCourse_ByClassCode_Success() {
        JoinCourseRequest request = JoinCourseRequest.builder()
            .classCode("FSW101")
            .build();

        when(userRepository.findById(4L)).thenReturn(Optional.of(sampleStudent));
        when(courseRepository.findByClassCode("FSW101")).thenReturn(Optional.of(sampleCourse));
        when(enrollmentRepository.findByUserIdAndCourseId(4L, 1L)).thenReturn(Optional.empty());
        when(enrollmentRepository.save(any(Enrollment.class))).thenReturn(sampleEnrollment);
        when(lessonRepository.countByCourseId(1L)).thenReturn(4L);
        when(lessonCompletionRepository.countByEnrollmentId(10L)).thenReturn(0L);

        EnrollmentResponse response = enrollmentService.joinCourse(request, 4L);

        assertNotNull(response);
        assertEquals(10L, response.getId());
        assertEquals("Khóa học Spring Boot", response.getCourseTitle());
        assertEquals("FSW101", response.getClassCode());
        verify(enrollmentRepository, times(1)).save(any(Enrollment.class));
    }

    @Test
    void testCompleteLesson_Calculates50PercentProgress() {
        when(enrollmentRepository.findByUserIdAndCourseId(4L, 1L)).thenReturn(Optional.of(sampleEnrollment));
        when(lessonRepository.findById(1L)).thenReturn(Optional.of(sampleLesson1));
        when(lessonCompletionRepository.existsByEnrollmentIdAndLessonId(10L, 1L)).thenReturn(false);
        when(lessonRepository.countByCourseId(1L)).thenReturn(2L);
        when(lessonCompletionRepository.countByEnrollmentId(10L)).thenReturn(1L);
        when(lessonCompletionRepository.findCompletedLessonIdsByEnrollmentId(10L)).thenReturn(List.of(1L));

        CourseProgressResponse prog = enrollmentService.completeLesson(1L, 1L, 4L);

        assertNotNull(prog);
        assertEquals(new BigDecimal("50.00"), prog.getProgressPercent());
        assertEquals(1L, prog.getCompletedLessons());
        assertEquals(2L, prog.getTotalLessons());
        assertEquals(List.of(1L), prog.getCompletedLessonIds());
        verify(lessonCompletionRepository, times(1)).save(any(LessonCompletion.class));
        verify(enrollmentRepository, times(1)).save(sampleEnrollment);
    }
}
