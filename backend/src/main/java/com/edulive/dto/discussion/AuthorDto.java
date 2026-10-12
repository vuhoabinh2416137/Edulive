package com.edulive.dto.discussion;

import com.edulive.entity.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthorDto {
    private Long id;
    private String fullName;
    private String email;
    private String avatarUrl;
    private Role role;
}
