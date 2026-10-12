package com.edulive.service;

import com.edulive.dto.quiz.*;
import com.edulive.entity.*;
import com.edulive.exception.AppException;
import com.edulive.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class QuizServiceTest {

    @Mock
    private QuizRepository quizRepository;

    @Mock
    private QuizQuestionRepository quizQuestionRepository;

    @Mock
    private QuizOptionRepository quizOptionRepository;

    @Mock
    private QuizAttemptRepository quizAttemptRepository;

    @Mock
    private QuizAnswerRepository quizAnswerRepository;

    @Mock
    private CourseRepository courseRepository;

    @Mock
    private ChapterRepository chapterRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private EnrollmentRepository enrollmentRepository;

    @InjectMocks
    private QuizService quizService;

    private User sampleStudent;
    private User sampleLecturer;
    private Course sampleCourse;
    private Quiz sampleQuiz;
    private QuizQuestion question1;
    private QuizQuestion question2;
    private QuizQuestion question3;

    @BeforeEach
    void setUp() {
        sampleStudent = User.builder()
                .id(4L)
                .email("student@edulive.vn")
                .fullName("Phạm Minh Anh")
                .role(Role.STUDENT)
                .status(UserStatus.ACTIVE)
                .build();

        sampleLecturer = User.builder()
                .id(2L)
                .email("lecturer@edulive.vn")
                .fullName("ThS. Nguyễn Văn A")
                .role(Role.LECTURER)
                .status(UserStatus.ACTIVE)
                .build();

        sampleCourse = Course.builder()
                .id(1L)
                .title("Lập trình Web Full-stack Spring Boot & React")
                .slug("lap-trinh-web-full-stack")
                .classCode("FSW101")
                .lecturer(sampleLecturer)
                .status(CourseStatus.PUBLISHED)
                .build();

        // Câu 1: Single Choice (1 điểm)
        QuizOption opt1 = QuizOption.builder().id(1L).optionText("Apache Tomcat").isCorrect(true).orderIndex(1).build();
        QuizOption opt2 = QuizOption.builder().id(2L).optionText("Eclipse Jetty").isCorrect(false).orderIndex(2).build();
        question1 = QuizQuestion.builder()
                .id(101L)
                .questionText("Spring Boot mặc định dùng server nào?")
                .questionType(QuestionType.SINGLE_CHOICE)
                .points(new BigDecimal("1.0"))
                .explanation("Spring Boot mặc định dùng Tomcat")
                .orderIndex(1)
                .options(new ArrayList<>(List.of(opt1, opt2)))
                .build();
        opt1.setQuestion(question1);
        opt2.setQuestion(question1);

        // Câu 2: Multiple Choice (1 điểm)
        QuizOption opt3 = QuizOption.builder().id(3L).optionText("Đặc tả STOMP frame").isCorrect(true).orderIndex(1).build();
        QuizOption opt4 = QuizOption.builder().id(4L).optionText("Mô hình pub/sub topic").isCorrect(true).orderIndex(2).build();
        QuizOption opt5 = QuizOption.builder().id(5L).optionText("Chỉ chạy trên UDP").isCorrect(false).orderIndex(3).build();
        question2 = QuizQuestion.builder()
                .id(102L)
                .questionText("Đặc điểm nào đúng về STOMP? (Chọn nhiều)")
                .questionType(QuestionType.MULTIPLE_CHOICE)
                .points(new BigDecimal("1.0"))
                .explanation("STOMP có frame và pub/sub")
                .orderIndex(2)
                .options(new ArrayList<>(List.of(opt3, opt4, opt5)))
                .build();
        opt3.setQuestion(question2);
        opt4.setQuestion(question2);
        opt5.setQuestion(question2);

        // Câu 3: True / False (1 điểm)
        QuizOption opt6 = QuizOption.builder().id(6L).optionText("Đúng").isCorrect(true).orderIndex(1).build();
        QuizOption opt7 = QuizOption.builder().id(7L).optionText("Sai").isCorrect(false).orderIndex(2).build();
        question3 = QuizQuestion.builder()
                .id(103L)
                .questionText("React Router v6 hỗ trợ SPA client-side routing?")
                .questionType(QuestionType.TRUE_FALSE)
                .points(new BigDecimal("1.0"))
                .explanation("React Router chặn reload trang")
                .orderIndex(3)
                .options(new ArrayList<>(List.of(opt6, opt7)))
                .build();
        opt6.setQuestion(question3);
        opt7.setQuestion(question3);

        sampleQuiz = Quiz.builder()
                .id(1L)
                .course(sampleCourse)
                .title("Kiểm tra trắc nghiệm: Kiến trúc Web Full-stack")
                .description("Kiểm tra kiến thức cơ bản")
                .timeLimitMinutes(15)
                .maxAttempts(3)
                .passingScore(new BigDecimal("50.0"))
                .questions(new ArrayList<>(List.of(question1, question2, question3)))
                .build();
        question1.setQuiz(sampleQuiz);
        question2.setQuiz(sampleQuiz);
        question3.setQuiz(sampleQuiz);
    }

    @Test
    void startQuiz_Success_HidesCorrectAnswers() {
        when(quizRepository.findById(1L)).thenReturn(Optional.of(sampleQuiz));
        when(userRepository.findById(4L)).thenReturn(Optional.of(sampleStudent));
        when(enrollmentRepository.existsByUserIdAndCourseId(4L, 1L)).thenReturn(true);
        when(quizAttemptRepository.countByQuizIdAndUserId(1L, 4L)).thenReturn(0L);

        when(quizAttemptRepository.save(any(QuizAttempt.class))).thenAnswer(invocation -> {
            QuizAttempt attempt = invocation.getArgument(0);
            attempt.setId(10L);
            return attempt;
        });

        StartQuizResponse response = quizService.startQuiz(1L, 4L);

        assertNotNull(response);
        assertEquals(10L, response.getAttemptId());
        assertEquals(1L, response.getQuizId());
        assertEquals(3, response.getQuestions().size());

        // Đảm bảo không để lộ đáp án đúng
        for (TakingQuestionResponse q : response.getQuestions()) {
            assertNotNull(q.getOptions());
            assertFalse(q.getOptions().isEmpty());
        }
        verify(quizAttemptRepository, times(1)).save(any(QuizAttempt.class));
    }

    @Test
    void startQuiz_ThrowsException_WhenExceedMaxAttempts() {
        when(quizRepository.findById(1L)).thenReturn(Optional.of(sampleQuiz));
        when(userRepository.findById(4L)).thenReturn(Optional.of(sampleStudent));
        when(enrollmentRepository.existsByUserIdAndCourseId(4L, 1L)).thenReturn(true);
        when(quizAttemptRepository.countByQuizIdAndUserId(1L, 4L)).thenReturn(3L); // Đã thi đủ 3 lần

        AppException ex = assertThrows(AppException.class, () -> quizService.startQuiz(1L, 4L));
        assertTrue(ex.getMessage().contains("hết số lần"));
    }

    @Test
    void startQuiz_ThrowsException_WhenNotEnrolled() {
        when(quizRepository.findById(1L)).thenReturn(Optional.of(sampleQuiz));
        when(userRepository.findById(4L)).thenReturn(Optional.of(sampleStudent));
        when(enrollmentRepository.existsByUserIdAndCourseId(4L, 1L)).thenReturn(false);

        AppException ex = assertThrows(AppException.class, () -> quizService.startQuiz(1L, 4L));
        assertTrue(ex.getMessage().contains("tham gia khóa học"));
    }

    @Test
    void submitQuiz_AutoGrading_CalculatesScoreCorrectly() {
        QuizAttempt attempt = QuizAttempt.builder()
                .id(10L)
                .quiz(sampleQuiz)
                .user(sampleStudent)
                .startedAt(Instant.now().minusSeconds(120))
                .status(QuizAttemptStatus.IN_PROGRESS)
                .build();

        when(quizAttemptRepository.findById(10L)).thenReturn(Optional.of(attempt));

        // Học viên trả lời:
        // Câu 1 (Single): chọn 1L (ĐÚNG)
        // Câu 2 (Multiple): chọn 3L, 4L (ĐÚNG cả 2 lựa chọn)
        // Câu 3 (True/False): chọn 7L (SAI, vì đáp án đúng là 6L)
        // Kết quả kỳ vọng: đúng 2/3 câu => 2/3 * 100 = 66.67 điểm => ĐẠT (>= 50.0)
        SubmitQuizRequest request = SubmitQuizRequest.builder()
                .answers(List.of(
                        new SubmitAnswerRequest(101L, List.of(1L)),
                        new SubmitAnswerRequest(102L, List.of(3L, 4L)),
                        new SubmitAnswerRequest(103L, List.of(7L))
                ))
                .build();

        when(quizAnswerRepository.save(any(QuizAnswer.class))).thenAnswer(i -> i.getArgument(0));
        when(quizAttemptRepository.save(any(QuizAttempt.class))).thenAnswer(i -> i.getArgument(0));

        QuizResultResponse result = quizService.submitQuiz(10L, 4L, request);

        assertNotNull(result);
        assertEquals(10L, result.getAttemptId());
        assertEquals(3, result.getTotalQuestions());
        assertEquals(2, result.getCorrectQuestionsCount());
        assertEquals(new BigDecimal("66.67"), result.getScore());
        assertTrue(result.getIsPassed());
        assertEquals(QuizAttemptStatus.SUBMITTED, result.getStatus());
        assertEquals(3, result.getReviewQuestions().size());

        // Kiểm tra câu 1 đúng
        ReviewAnswerResponse r1 = result.getReviewQuestions().get(0);
        assertTrue(r1.getIsCorrect());
        assertEquals(new BigDecimal("1.0"), r1.getEarnedPoints());

        // Kiểm tra câu 3 sai
        ReviewAnswerResponse r3 = result.getReviewQuestions().get(2);
        assertFalse(r3.getIsCorrect());
        assertEquals(BigDecimal.ZERO, r3.getEarnedPoints());

        verify(quizAttemptRepository, times(1)).save(attempt);
        verify(quizAnswerRepository, times(3)).save(any(QuizAnswer.class));
    }

    @Test
    void exportQuizCsv_ReturnsValidCsv() {
        QuizAttempt attempt1 = QuizAttempt.builder()
                .id(1L)
                .quiz(sampleQuiz)
                .user(sampleStudent)
                .startedAt(Instant.now().minusSeconds(300))
                .submittedAt(Instant.now().minusSeconds(100))
                .score(new BigDecimal("80.00"))
                .isPassed(true)
                .status(QuizAttemptStatus.SUBMITTED)
                .build();

        when(quizRepository.findById(1L)).thenReturn(Optional.of(sampleQuiz));
        when(userRepository.findById(2L)).thenReturn(Optional.of(sampleLecturer));
        when(quizAttemptRepository.findByQuizIdOrderByStartedAtDesc(1L)).thenReturn(List.of(attempt1));

        byte[] csvBytes = quizService.exportQuizCsv(1L, 2L);
        assertNotNull(csvBytes);
        assertTrue(csvBytes.length > 0);

        String csvContent = new String(csvBytes, java.nio.charset.StandardCharsets.UTF_8);
        assertTrue(csvContent.contains("BÁO CÁO KẾT QUẢ BÀI THI TRẮC NGHIỆM"));
        assertTrue(csvContent.contains("Phạm Minh Anh"));
        assertTrue(csvContent.contains("80.00"));
        assertTrue(csvContent.contains("ĐẠT"));
    }
}
