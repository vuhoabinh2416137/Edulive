package com.edulive.controller;

import com.edulive.dto.user.ChangePasswordRequest;
import com.edulive.dto.user.UpdateProfileRequest;
import com.edulive.dto.user.UserResponse;
import com.edulive.security.UserPrincipal;
import com.edulive.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "Các endpoint quản lý hồ sơ và tài khoản cá nhân")
@SecurityRequirement(name = "Bearer Authentication")
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    @Operation(summary = "Lấy thông tin tài khoản hiện tại", description = "Trả về thông tin hồ sơ của người dùng đang đăng nhập")
    public ResponseEntity<UserResponse> getCurrentUser(@AuthenticationPrincipal UserPrincipal currentUser) {
        UserResponse response = userService.getUserById(currentUser.getId());
        return ResponseEntity.ok(response);
    }

    @PutMapping({"/profile", "/me"})
    @Operation(summary = "Cập nhật thông tin cá nhân", description = "Cập nhật họ tên hoặc avatar")
    public ResponseEntity<UserResponse> updateProfile(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody UpdateProfileRequest request) {
        UserResponse response = userService.updateProfile(currentUser.getId(), request);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/change-password")
    @Operation(summary = "Đổi mật khẩu", description = "Kiểm tra mật khẩu cũ và cập nhật mật khẩu mới")
    public ResponseEntity<Map<String, String>> changePassword(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(currentUser.getId(), request);
        return ResponseEntity.ok(Map.of("message", "Đổi mật khẩu thành công"));
    }
}
