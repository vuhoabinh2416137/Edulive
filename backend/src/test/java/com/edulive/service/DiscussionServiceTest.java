package com.edulive.service;

import com.edulive.dto.discussion.*;
import com.edulive.entity.*;
import com.edulive.exception.AppException;
import com.edulive.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DiscussionServiceTest {

    @Mock
    private DiscussionRepository discussionRepository;

    @Mock
    private DiscussionCommentRepository commentRepository;

    @Mock
    private CourseRepository courseRepository;

    @Mock
    private LessonRepository lessonRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private EnrollmentRepository enrollmentRepository;

    @InjectMocks
    private DiscussionService discussionService;

    private User sampleStudent;
    private User sampleLecturer;
    private Course sampleCourse;
    private Discussion sampleDiscussion;

    @BeforeEach
    void setUp() {
        sampleStudent = User.builder()
                .id(4L)
                .email("student@edulive.vn")
                .fullName("Phạm Minh Anh")
                .role(Role.STUDENT)
                .build();

        sampleLecturer = User.builder()
                .id(2L)
                .email("lecturer@edulive.vn")
                .fullName("ThS. Nguyễn Văn A")
                .role(Role.LECTURER)
                .build();

        sampleCourse = Course.builder()
                .id(1L)
                .title("Lập trình Web Full-stack")
                .lecturer(sampleLecturer)
                .build();

        sampleDiscussion = Discussion.builder()
                .id(1L)
                .course(sampleCourse)
                .user(sampleStudent)
                .title("Câu hỏi về WebSocket CORS")
                .content("Làm thế nào để cấu hình CORS cho WebSocket?")
                .isPinned(false)
                .createdAt(Instant.now())
                .comments(new ArrayList<>())
                .build();
    }

    @Test
    void createDiscussion_Success() {
        CreateDiscussionRequest request = CreateDiscussionRequest.builder()
                .title("Hỏi về STOMP Frame")
                .content("Nội dung chi tiết")
                .build();

        when(courseRepository.findById(1L)).thenReturn(Optional.of(sampleCourse));
        when(userRepository.findById(4L)).thenReturn(Optional.of(sampleStudent));
        when(enrollmentRepository.existsByUserIdAndCourseId(4L, 1L)).thenReturn(true);
        when(discussionRepository.save(any(Discussion.class))).thenAnswer(i -> {
            Discussion d = i.getArgument(0);
            d.setId(10L);
            d.setCreatedAt(Instant.now());
            return d;
        });
        when(discussionRepository.findById(10L)).thenReturn(Optional.of(sampleDiscussion));

        DiscussionDetailResponse response = discussionService.createDiscussion(4L, 1L, request);

        assertNotNull(response);
        verify(discussionRepository, times(1)).save(any(Discussion.class));
    }

    @Test
    void createDiscussion_ThrowsException_WhenNotEnrolled() {
        CreateDiscussionRequest request = CreateDiscussionRequest.builder()
                .title("Hỏi bài")
                .content("Nội dung")
                .build();

        when(courseRepository.findById(1L)).thenReturn(Optional.of(sampleCourse));
        when(userRepository.findById(4L)).thenReturn(Optional.of(sampleStudent));
        when(enrollmentRepository.existsByUserIdAndCourseId(4L, 1L)).thenReturn(false);

        assertThrows(AppException.class, () -> discussionService.createDiscussion(4L, 1L, request));
    }

    @Test
    void addComment_NestedReplies_Success() {
        CreateCommentRequest request = CreateCommentRequest.builder()
                .content("Em thử dùng .setAllowedOriginPatterns('*') xem")
                .parentId(null)
                .build();

        when(discussionRepository.findById(1L)).thenReturn(Optional.of(sampleDiscussion));
        when(userRepository.findById(2L)).thenReturn(Optional.of(sampleLecturer));
        when(commentRepository.save(any(DiscussionComment.class))).thenAnswer(i -> {
            DiscussionComment c = i.getArgument(0);
            c.setId(100L);
            c.setCreatedAt(Instant.now());
            return c;
        });

        CommentResponse response = discussionService.addComment(2L, 1L, request);

        assertNotNull(response);
        assertEquals("Em thử dùng .setAllowedOriginPatterns('*') xem", response.getContent());
        assertFalse(response.getIsAcceptedAnswer());
        verify(commentRepository, times(1)).save(any(DiscussionComment.class));
    }

    @Test
    void acceptAnswer_Success() {
        DiscussionComment comment = DiscussionComment.builder()
                .id(100L)
                .discussion(sampleDiscussion)
                .user(sampleLecturer)
                .content("Câu trả lời chuẩn")
                .isAcceptedAnswer(false)
                .build();

        when(commentRepository.findById(100L)).thenReturn(Optional.of(comment));
        when(userRepository.findById(4L)).thenReturn(Optional.of(sampleStudent)); // tác giả discussion
        when(commentRepository.findByDiscussionIdOrderByCreatedAtAsc(1L)).thenReturn(List.of(comment));

        discussionService.acceptAnswer(4L, 100L);

        assertTrue(comment.getIsAcceptedAnswer());
        verify(commentRepository, times(1)).save(comment);
    }

    @Test
    void togglePin_OnlyLecturerOrAdmin() {
        when(discussionRepository.findById(1L)).thenReturn(Optional.of(sampleDiscussion));
        when(userRepository.findById(2L)).thenReturn(Optional.of(sampleLecturer));

        discussionService.togglePin(2L, 1L);

        assertTrue(sampleDiscussion.getIsPinned());
        verify(discussionRepository, times(1)).save(sampleDiscussion);
    }
}
