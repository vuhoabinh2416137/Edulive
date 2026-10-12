package com.edulive.dto.webrtc;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SignalMessage {
    // JOIN, OFFER, ANSWER, ICE_CANDIDATE, LEAVE, TOGGLE_MEDIA, HAND_RAISE
    private String type;
    private Long senderId;
    private String senderName;
    private Long targetId; // null nếu broadcast toàn phòng
    private Object payload; // SDP offer/answer string hoặc ICE candidate object
}
