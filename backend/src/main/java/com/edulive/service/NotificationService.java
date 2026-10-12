package com.edulive.service;

import com.edulive.dto.response.NotificationResponse;
import com.edulive.entity.Notification;
import com.edulive.entity.User;
import com.edulive.exception.ResourceNotFoundException;
import com.edulive.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional(readOnly = true)
    public List<NotificationResponse> getRecentNotifications(Long userId) {
        return notificationRepository.findTop20ByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<NotificationResponse> getNotifications(Long userId, Pageable pageable) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    @Transactional
    public NotificationResponse markAsRead(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", "id", notificationId));

        if (!notification.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Không có quyền cập nhật thông báo này");
        }

        notification.setIsRead(true);
        Notification saved = notificationRepository.save(notification);
        return mapToResponse(saved);
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        notificationRepository.markAllAsReadByUserId(userId);
    }

    @Transactional
    public NotificationResponse createAndSendNotification(User recipient, String title, String message, String type, String link) {
        Notification notification = Notification.builder()
                .user(recipient)
                .title(title)
                .message(message)
                .type(type)
                .link(link)
                .isRead(false)
                .build();

        Notification saved = notificationRepository.save(notification);
        NotificationResponse response = mapToResponse(saved);

        // Bắn WebSocket thông báo thời gian thực tới kênh riêng của người nhận
        try {
            messagingTemplate.convertAndSend("/topic/notifications/user/" + recipient.getId(), response);
        } catch (Exception e) {
            log.warn("Không thể gửi thông báo WebSocket tới user {}: {}", recipient.getId(), e.getMessage());
        }

        return response;
    }

    private NotificationResponse mapToResponse(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .title(n.getTitle())
                .message(n.getMessage())
                .type(n.getType())
                .isRead(n.getIsRead())
                .link(n.getLink())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
