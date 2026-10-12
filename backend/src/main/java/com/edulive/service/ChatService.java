package com.edulive.service;

import com.edulive.dto.chat.ChatMessageDto;
import com.edulive.entity.ChatMessage;
import com.edulive.entity.Course;
import com.edulive.entity.User;
import com.edulive.exception.AppException;
import com.edulive.exception.ResourceNotFoundException;
import com.edulive.repository.ChatMessageRepository;
import com.edulive.repository.CourseRepository;
import com.edulive.repository.EnrollmentRepository;
import com.edulive.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final EnrollmentRepository enrollmentRepository;

    @Transactional(readOnly = true)
    public List<ChatMessageDto> getRecentMessages(Long courseId) {
        List<ChatMessage> list = chatMessageRepository.findTop50ByCourseIdOrderByCreatedAtDesc(courseId);
        // Đảo ngược lại theo thứ tự thời gian tăng dần để frontend hiển thị từ trên xuống dưới
        Collections.reverse(list);

        return list.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional
    public ChatMessageDto saveMessage(Long userId, Long courseId, String content) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", courseId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        boolean isEnrolled = enrollmentRepository.existsByUserIdAndCourseId(userId, courseId);
        boolean isTeacherOrAdmin = user.getRole().name().equals("ADMIN") || course.getLecturer().getId().equals(userId);
        if (!isEnrolled && !isTeacherOrAdmin) {
            throw new AppException("Bạn cần tham gia khóa học để nhắn tin trong nhóm", HttpStatus.FORBIDDEN);
        }

        ChatMessage message = ChatMessage.builder()
                .course(course)
                .user(user)
                .content(content)
                .build();

        ChatMessage saved = chatMessageRepository.save(message);
        return mapToDto(saved);
    }

    private ChatMessageDto mapToDto(ChatMessage m) {
        User u = m.getUser();
        return ChatMessageDto.builder()
                .id(m.getId())
                .courseId(m.getCourse().getId())
                .userId(u.getId())
                .userFullName(u.getFullName())
                .userAvatarUrl(u.getAvatarUrl())
                .userRole(u.getRole())
                .content(m.getContent())
                .createdAt(m.getCreatedAt())
                .build();
    }
}
