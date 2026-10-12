package com.edulive.service;

import com.edulive.dto.discussion.*;
import com.edulive.entity.*;
import com.edulive.exception.AppException;
import com.edulive.exception.ResourceNotFoundException;
import com.edulive.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DiscussionService {

    private final DiscussionRepository discussionRepository;
    private final DiscussionCommentRepository commentRepository;
    private final CourseRepository courseRepository;
    private final LessonRepository lessonRepository;
    private final UserRepository userRepository;
    private final EnrollmentRepository enrollmentRepository;

    @Transactional(readOnly = true)
    public List<DiscussionSummaryResponse> getDiscussions(Long courseId, Long lessonId) {
        List<Discussion> list = (lessonId != null)
                ? discussionRepository.findByCourseIdAndLessonIdOrderByIsPinnedDescCreatedAtDesc(courseId, lessonId)
                : discussionRepository.findByCourseIdOrderByIsPinnedDescCreatedAtDesc(courseId);

        return list.stream().map(this::mapToSummary).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public DiscussionDetailResponse getDiscussionById(Long id) {
        Discussion discussion = discussionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Discussion", "id", id));

        // Lấy tất cả comments và xây dựng cây phân cấp lồng nhau
        List<DiscussionComment> allComments = commentRepository.findByDiscussionIdOrderByCreatedAtAsc(id);
        List<CommentResponse> rootComments = buildCommentTree(allComments);

        return DiscussionDetailResponse.builder()
                .id(discussion.getId())
                .courseId(discussion.getCourse().getId())
                .lessonId(discussion.getLesson() != null ? discussion.getLesson().getId() : null)
                .lessonTitle(discussion.getLesson() != null ? discussion.getLesson().getTitle() : null)
                .title(discussion.getTitle())
                .content(discussion.getContent())
                .isPinned(discussion.getIsPinned())
                .createdAt(discussion.getCreatedAt())
                .updatedAt(discussion.getUpdatedAt())
                .author(mapToAuthor(discussion.getUser()))
                .comments(rootComments)
                .build();
    }

    @Transactional
    public DiscussionDetailResponse createDiscussion(Long userId, Long courseId, CreateDiscussionRequest request) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", courseId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        // Kiểm tra quyền: đã đăng ký học hoặc là giảng viên/admin
        boolean isEnrolled = enrollmentRepository.existsByUserIdAndCourseId(userId, courseId);
        boolean isTeacherOrAdmin = user.getRole().name().equals("ADMIN") || course.getLecturer().getId().equals(userId);
        if (!isEnrolled && !isTeacherOrAdmin) {
            throw new AppException("Bạn cần tham gia khóa học để đăng chủ đề thảo luận", HttpStatus.FORBIDDEN);
        }

        Lesson lesson = null;
        if (request.getLessonId() != null) {
            lesson = lessonRepository.findById(request.getLessonId())
                    .orElseThrow(() -> new ResourceNotFoundException("Lesson", "id", request.getLessonId()));
        }

        Discussion discussion = Discussion.builder()
                .course(course)
                .lesson(lesson)
                .user(user)
                .title(request.getTitle())
                .content(request.getContent())
                .isPinned(false)
                .comments(new ArrayList<>())
                .build();

        Discussion saved = discussionRepository.save(discussion);
        return getDiscussionById(saved.getId());
    }

    @Transactional
    public CommentResponse addComment(Long userId, Long discussionId, CreateCommentRequest request) {
        Discussion discussion = discussionRepository.findById(discussionId)
                .orElseThrow(() -> new ResourceNotFoundException("Discussion", "id", discussionId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        Long courseId = discussion.getCourse().getId();
        boolean isEnrolled = enrollmentRepository.existsByUserIdAndCourseId(userId, courseId);
        boolean isTeacherOrAdmin = user.getRole().name().equals("ADMIN") || discussion.getCourse().getLecturer().getId().equals(userId);
        if (!isEnrolled && !isTeacherOrAdmin) {
            throw new AppException("Bạn cần tham gia khóa học để bình luận", HttpStatus.FORBIDDEN);
        }

        DiscussionComment parent = null;
        if (request.getParentId() != null) {
            parent = commentRepository.findById(request.getParentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent Comment", "id", request.getParentId()));
            if (!parent.getDiscussion().getId().equals(discussionId)) {
                throw new AppException("Bình luận cha không thuộc về cuộc thảo luận này", HttpStatus.BAD_REQUEST);
            }
        }

        DiscussionComment comment = DiscussionComment.builder()
                .discussion(discussion)
                .parent(parent)
                .user(user)
                .content(request.getContent())
                .isAcceptedAnswer(false)
                .replies(new ArrayList<>())
                .build();

        DiscussionComment saved = commentRepository.save(comment);

        return CommentResponse.builder()
                .id(saved.getId())
                .discussionId(discussion.getId())
                .parentId(parent != null ? parent.getId() : null)
                .content(saved.getContent())
                .isAcceptedAnswer(saved.getIsAcceptedAnswer())
                .createdAt(saved.getCreatedAt())
                .author(mapToAuthor(user))
                .replies(new ArrayList<>())
                .build();
    }

    @Transactional
    public void togglePin(Long userId, Long discussionId) {
        Discussion discussion = discussionRepository.findById(discussionId)
                .orElseThrow(() -> new ResourceNotFoundException("Discussion", "id", discussionId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        boolean isTeacherOrAdmin = user.getRole().name().equals("ADMIN") || discussion.getCourse().getLecturer().getId().equals(userId);
        if (!isTeacherOrAdmin) {
            throw new AppException("Chỉ giảng viên hoặc quản trị viên mới có quyền ghim bài thảo luận", HttpStatus.FORBIDDEN);
        }

        discussion.setIsPinned(!Boolean.TRUE.equals(discussion.getIsPinned()));
        discussionRepository.save(discussion);
    }

    @Transactional
    public void acceptAnswer(Long userId, Long commentId) {
        DiscussionComment targetComment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment", "id", commentId));

        Discussion discussion = targetComment.getDiscussion();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        boolean isAuthor = discussion.getUser().getId().equals(userId);
        boolean isTeacherOrAdmin = user.getRole().name().equals("ADMIN") || discussion.getCourse().getLecturer().getId().equals(userId);

        if (!isAuthor && !isTeacherOrAdmin) {
            throw new AppException("Chỉ người tạo thảo luận hoặc giảng viên mới có quyền đánh dấu câu trả lời đúng", HttpStatus.FORBIDDEN);
        }

        // Bỏ đánh dấu câu trả lời cũ trong thảo luận (nếu có)
        List<DiscussionComment> comments = commentRepository.findByDiscussionIdOrderByCreatedAtAsc(discussion.getId());
        for (DiscussionComment c : comments) {
            if (c.getIsAcceptedAnswer() && !c.getId().equals(commentId)) {
                c.setIsAcceptedAnswer(false);
                commentRepository.save(c);
            }
        }

        targetComment.setIsAcceptedAnswer(!Boolean.TRUE.equals(targetComment.getIsAcceptedAnswer()));
        commentRepository.save(targetComment);
    }

    @Transactional
    public void deleteDiscussion(Long userId, Long discussionId) {
        Discussion discussion = discussionRepository.findById(discussionId)
                .orElseThrow(() -> new ResourceNotFoundException("Discussion", "id", discussionId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        boolean isAuthor = discussion.getUser().getId().equals(userId);
        boolean isTeacherOrAdmin = user.getRole().name().equals("ADMIN") || discussion.getCourse().getLecturer().getId().equals(userId);

        if (!isAuthor && !isTeacherOrAdmin) {
            throw new AppException("Bạn không có quyền xóa bài thảo luận này", HttpStatus.FORBIDDEN);
        }

        discussionRepository.delete(discussion);
    }

    @Transactional
    public void deleteComment(Long userId, Long commentId) {
        DiscussionComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment", "id", commentId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        boolean isAuthor = comment.getUser().getId().equals(userId);
        boolean isTeacherOrAdmin = user.getRole().name().equals("ADMIN") || comment.getDiscussion().getCourse().getLecturer().getId().equals(userId);

        if (!isAuthor && !isTeacherOrAdmin) {
            throw new AppException("Bạn không có quyền xóa bình luận này", HttpStatus.FORBIDDEN);
        }

        commentRepository.delete(comment);
    }

    // Helper: xây dựng cây comment đa tầng
    private List<CommentResponse> buildCommentTree(List<DiscussionComment> allComments) {
        Map<Long, CommentResponse> map = new LinkedHashMap<>();
        List<CommentResponse> roots = new ArrayList<>();

        for (DiscussionComment dc : allComments) {
            CommentResponse resp = CommentResponse.builder()
                    .id(dc.getId())
                    .discussionId(dc.getDiscussion().getId())
                    .parentId(dc.getParent() != null ? dc.getParent().getId() : null)
                    .content(dc.getContent())
                    .isAcceptedAnswer(dc.getIsAcceptedAnswer())
                    .createdAt(dc.getCreatedAt())
                    .author(mapToAuthor(dc.getUser()))
                    .replies(new ArrayList<>())
                    .build();
            map.put(dc.getId(), resp);
        }

        for (DiscussionComment dc : allComments) {
            CommentResponse current = map.get(dc.getId());
            if (dc.getParent() != null && map.containsKey(dc.getParent().getId())) {
                map.get(dc.getParent().getId()).getReplies().add(current);
            } else {
                roots.add(current);
            }
        }

        return roots;
    }

    private DiscussionSummaryResponse mapToSummary(Discussion d) {
        List<DiscussionComment> comments = d.getComments();
        int commentCount = comments != null ? comments.size() : 0;
        boolean hasAccepted = comments != null && comments.stream().anyMatch(c -> Boolean.TRUE.equals(c.getIsAcceptedAnswer()));

        return DiscussionSummaryResponse.builder()
                .id(d.getId())
                .courseId(d.getCourse().getId())
                .lessonId(d.getLesson() != null ? d.getLesson().getId() : null)
                .lessonTitle(d.getLesson() != null ? d.getLesson().getTitle() : null)
                .title(d.getTitle())
                .content(d.getContent())
                .isPinned(d.getIsPinned())
                .createdAt(d.getCreatedAt())
                .updatedAt(d.getUpdatedAt())
                .author(mapToAuthor(d.getUser()))
                .commentCount(commentCount)
                .hasAcceptedAnswer(hasAccepted)
                .build();
    }

    private AuthorDto mapToAuthor(User u) {
        return AuthorDto.builder()
                .id(u.getId())
                .fullName(u.getFullName())
                .email(u.getEmail())
                .avatarUrl(u.getAvatarUrl())
                .role(u.getRole())
                .build();
    }
}
