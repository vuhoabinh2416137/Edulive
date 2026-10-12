package com.edulive.controller;

import com.edulive.dto.chat.ChatMessageDto;
import com.edulive.dto.chat.SendChatMessageRequest;
import com.edulive.security.UserPrincipal;
import com.edulive.service.ChatService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/courses/{courseId}/chat-messages")
@RequiredArgsConstructor
@Tag(name = "Chat", description = "Các API Lịch sử chat nhóm thời gian thực của khóa học")
public class ChatController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "Lấy lịch sử tin nhắn chat của khóa học", description = "Lấy 50 tin nhắn mới nhất trong nhóm chat của khóa học")
    public ResponseEntity<List<ChatMessageDto>> getRecentMessages(@PathVariable Long courseId) {
        return ResponseEntity.ok(chatService.getRecentMessages(courseId));
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "Gửi tin nhắn qua REST API (hỗ trợ HTTP fallback)", description = "Lưu tin nhắn và broadcast qua WebSocket topic /topic/course/{courseId}/chat")
    public ResponseEntity<ChatMessageDto> sendMessage(
            @PathVariable Long courseId,
            @Valid @RequestBody SendChatMessageRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        ChatMessageDto message = chatService.saveMessage(currentUser.getId(), courseId, request.getContent());
        // Broadcast qua WebSocket topic cho các thành viên đang online
        messagingTemplate.convertAndSend("/topic/course/" + courseId + "/chat", message);
        return ResponseEntity.status(HttpStatus.CREATED).body(message);
    }
}
