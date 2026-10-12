package com.edulive.service;

import com.edulive.dto.discussion.AuthorDto;
import com.edulive.dto.webrtc.CreateVideoRoomRequest;
import com.edulive.dto.webrtc.IceServerConfig;
import com.edulive.dto.webrtc.VideoRoomResponse;
import com.edulive.entity.Course;
import com.edulive.entity.User;
import com.edulive.entity.VideoRoom;
import com.edulive.exception.AppException;
import com.edulive.exception.ResourceNotFoundException;
import com.edulive.repository.CourseRepository;
import com.edulive.repository.EnrollmentRepository;
import com.edulive.repository.UserRepository;
import com.edulive.repository.VideoRoomRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class VideoRoomService {

    private final VideoRoomRepository videoRoomRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final EnrollmentRepository enrollmentRepository;

    private static final String CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    @Transactional
    public VideoRoomResponse createRoom(Long userId, CreateVideoRoomRequest request) {
        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", request.getCourseId()));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        boolean isTeacherOrAdmin = user.getRole().name().equals("ADMIN") || course.getLecturer().getId().equals(userId);
        if (!isTeacherOrAdmin) {
            throw new AppException("Chỉ giảng viên của khóa học mới có quyền tạo phòng học trực tuyến", HttpStatus.FORBIDDEN);
        }

        // Sinh mã phòng ngẫu nhiên duy nhất
        String roomCode;
        do {
            roomCode = "ROOM-" + generateRandomCode(6);
        } while (videoRoomRepository.existsByRoomCode(roomCode));

        VideoRoom room = VideoRoom.builder()
                .course(course)
                .host(user)
                .roomCode(roomCode)
                .title(request.getTitle())
                .isActive(true)
                .scheduledAt(request.getScheduledAt() != null ? request.getScheduledAt() : Instant.now())
                .build();

        VideoRoom saved = videoRoomRepository.save(room);
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public VideoRoomResponse getRoomByCode(String roomCode, Long userId) {
        VideoRoom room = videoRoomRepository.findByRoomCode(roomCode)
                .orElseThrow(() -> new ResourceNotFoundException("VideoRoom", "roomCode", roomCode));

        if (userId != null) {
            boolean isEnrolled = enrollmentRepository.existsByUserIdAndCourseId(userId, room.getCourse().getId());
            boolean isHostOrAdmin = room.getHost().getId().equals(userId) ||
                    userRepository.findById(userId).map(u -> u.getRole().name().equals("ADMIN")).orElse(false);

            if (!isEnrolled && !isHostOrAdmin) {
                throw new AppException("Bạn cần tham gia khóa học trước khi vào phòng học trực tuyến này", HttpStatus.FORBIDDEN);
            }
        }

        return mapToResponse(room);
    }

    @Transactional(readOnly = true)
    public List<VideoRoomResponse> getRoomsByCourse(Long courseId) {
        List<VideoRoom> rooms = videoRoomRepository.findByCourseIdOrderByScheduledAtDesc(courseId);
        return rooms.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional
    public void closeRoom(String roomCode, Long userId) {
        VideoRoom room = videoRoomRepository.findByRoomCode(roomCode)
                .orElseThrow(() -> new ResourceNotFoundException("VideoRoom", "roomCode", roomCode));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        boolean isHostOrAdmin = user.getRole().name().equals("ADMIN") || room.getHost().getId().equals(userId);
        if (!isHostOrAdmin) {
            throw new AppException("Bạn không có quyền đóng phòng học này", HttpStatus.FORBIDDEN);
        }

        room.setIsActive(false);
        videoRoomRepository.save(room);
    }

    public List<IceServerConfig> getIceServers() {
        return List.of(
                IceServerConfig.builder()
                        .urls(List.of(
                                "stun:stun.l.google.com:19302",
                                "stun:stun1.l.google.com:19302",
                                "stun:stun2.l.google.com:19302",
                                "stun:stun3.l.google.com:19302",
                                "stun:stun4.l.google.com:19302"
                        ))
                        .build()
        );
    }

    private String generateRandomCode(int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(CHARS.charAt(RANDOM.nextInt(CHARS.length())));
        }
        return sb.toString();
    }

    private VideoRoomResponse mapToResponse(VideoRoom r) {
        User h = r.getHost();
        return VideoRoomResponse.builder()
                .id(r.getId())
                .courseId(r.getCourse().getId())
                .courseTitle(r.getCourse().getTitle())
                .roomCode(r.getRoomCode())
                .title(r.getTitle())
                .isActive(r.getIsActive())
                .isLive(r.getIsActive())
                .hostId(h.getId())
                .hostName(h.getFullName())
                .scheduledAt(r.getScheduledAt())
                .createdAt(r.getCreatedAt())
                .host(AuthorDto.builder()
                        .id(h.getId())
                        .fullName(h.getFullName())
                        .email(h.getEmail())
                        .avatarUrl(h.getAvatarUrl())
                        .role(h.getRole())
                        .build())
                .build();
    }
}
