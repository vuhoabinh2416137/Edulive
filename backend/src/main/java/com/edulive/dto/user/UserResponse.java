package com.edulive.dto.user;

import com.edulive.entity.Role;
import com.edulive.entity.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {

    private Long id;
    private String email;
    private String fullName;
    private String avatarUrl;
    private Role role;
    private UserStatus status;
    private Instant createdAt;
}
