package com.edulive.controller;

import com.edulive.dto.webrtc.CreateVideoRoomRequest;
import com.edulive.dto.webrtc.IceServerConfig;
import com.edulive.dto.webrtc.VideoRoomResponse;
import com.edulive.security.UserPrincipal;
import com.edulive.service.VideoRoomService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Tag(name = "VideoRoom", description = "Các API Phòng học trực tuyến Video Call WebRTC")
public class VideoRoomController {

    private final VideoRoomService videoRoomService;

    @PostMapping("/video-rooms")
    @PreAuthorize("hasAnyRole('LECTURER', 'ADMIN')")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "Tạo phòng học trực tuyến mới", description = "Giảng viên tạo phòng học video call WebRTC cho khóa học")
    public ResponseEntity<VideoRoomResponse> createRoom(
            @Valid @RequestBody CreateVideoRoomRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        VideoRoomResponse response = videoRoomService.createRoom(currentUser.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/video-rooms/{roomCode}")
    @Operation(summary = "Kiểm tra và lấy thông tin phòng học", description = "Lấy chi tiết phòng học trực tuyến theo mã phòng")
    public ResponseEntity<VideoRoomResponse> getRoomByCode(
            @PathVariable String roomCode,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        Long userId = currentUser != null ? currentUser.getId() : null;
        return ResponseEntity.ok(videoRoomService.getRoomByCode(roomCode, userId));
    }

    @GetMapping("/courses/{courseId}/video-rooms")
    @Operation(summary = "Danh sách phòng học trực tuyến của khóa học", description = "Lấy các phòng học đang mở hoặc theo lịch của khóa học")
    public ResponseEntity<List<VideoRoomResponse>> getRoomsByCourse(@PathVariable Long courseId) {
        return ResponseEntity.ok(videoRoomService.getRoomsByCourse(courseId));
    }

    @PutMapping("/video-rooms/{roomCode}/close")
    @PreAuthorize("hasAnyRole('LECTURER', 'ADMIN')")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "Đóng phòng học trực tuyến", description = "Giảng viên kết thúc buổi học trực tuyến")
    public ResponseEntity<Void> closeRoom(
            @PathVariable String roomCode,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        videoRoomService.closeRoom(roomCode, currentUser.getId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/video-rooms/ice-servers")
    @Operation(summary = "Lấy cấu hình STUN/TURN ICE Servers", description = "Trả về danh sách ICE servers Google STUN miễn phí cho WebRTC")
    public ResponseEntity<List<IceServerConfig>> getIceServers() {
        return ResponseEntity.ok(videoRoomService.getIceServers());
    }
}
