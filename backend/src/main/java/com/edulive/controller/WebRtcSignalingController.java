package com.edulive.controller;

import com.edulive.dto.webrtc.SignalMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
@RequiredArgsConstructor
@Slf4j
public class WebRtcSignalingController {

    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Nhận và chuyển tiếp tín hiệu WebRTC Signaling giữa các peers trong phòng học trực tuyến
     * Destination: /app/webrtc/{roomCode}/signal
     * Broadcast to: /topic/room/{roomCode}/signal
     */
    @MessageMapping("/webrtc/{roomCode}/signal")
    public void handleSignal(
            @DestinationVariable String roomCode,
            @Payload SignalMessage message,
            Principal principal) {
        log.debug("WebRTC signal received for room {}: type={}, sender={}", 
                roomCode, message.getType(), message.getSenderId());
        
        // Chuyển tiếp tín hiệu cho tất cả người tham gia trong phòng
        // Các client sẽ tự kiểm tra targetId (nếu targetId != null thì chỉ client có ID tương ứng xử lý)
        messagingTemplate.convertAndSend("/topic/room/" + roomCode + "/signal", message);
    }
}
