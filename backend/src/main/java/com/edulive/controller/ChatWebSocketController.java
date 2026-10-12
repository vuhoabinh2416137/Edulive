package com.edulive.controller;

import com.edulive.dto.chat.ChatMessageDto;
import com.edulive.dto.chat.SendChatMessageRequest;
import com.edulive.security.UserPrincipal;
import com.edulive.service.ChatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Slf4j
@Controller
@RequiredArgsConstructor
public class ChatWebSocketController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/chat/{courseId}")
    public void handleChatMessage(
            @DestinationVariable Long courseId,
            @Payload SendChatMessageRequest request,
            Principal principal) {
        if (principal == null) {
            log.warn("Unauthenticated attempt to send chat message to course: {}", courseId);
            return;
        }

        try {
            Long userId;
            if (principal instanceof org.springframework.security.authentication.UsernamePasswordAuthenticationToken auth) {
                UserPrincipal userPrincipal = (UserPrincipal) auth.getPrincipal();
                userId = userPrincipal.getId();
            } else {
                userId = Long.parseLong(principal.getName());
            }

            ChatMessageDto savedMessage = chatService.saveMessage(userId, courseId, request.getContent());
            messagingTemplate.convertAndSend("/topic/course/" + courseId + "/chat", savedMessage);
            log.info("Broadcasted chat message in course {} from user {}", courseId, userId);
        } catch (Exception ex) {
            log.error("Failed to handle chat message in course {}: {}", courseId, ex.getMessage());
        }
    }
}
