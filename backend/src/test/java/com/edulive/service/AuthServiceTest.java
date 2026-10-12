package com.edulive.service;

import com.edulive.dto.auth.AuthResponse;
import com.edulive.dto.auth.LoginRequest;
import com.edulive.dto.auth.RegisterRequest;
import com.edulive.dto.user.UserResponse;
import com.edulive.entity.RefreshToken;
import com.edulive.entity.Role;
import com.edulive.entity.User;
import com.edulive.entity.UserStatus;
import com.edulive.exception.AppException;
import com.edulive.mapper.UserMapper;
import com.edulive.repository.RefreshTokenRepository;
import com.edulive.repository.UserRepository;
import com.edulive.security.JwtTokenProvider;
import com.edulive.security.RateLimiterService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private UserMapper userMapper;

    @Mock
    private RateLimiterService rateLimiterService;

    @InjectMocks
    private AuthService authService;

    private User sampleUser;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(authService, "refreshTokenDurationMs", 604800000L);

        sampleUser = User.builder()
            .id(1L)
            .email("test@edulive.vn")
            .passwordHash("$2a$10$hashedpassword")
            .fullName("Nguyen Van Test")
            .role(Role.STUDENT)
            .status(UserStatus.ACTIVE)
            .build();
    }

    @Test
    void register_Success() {
        RegisterRequest request = RegisterRequest.builder()
            .email("new@edulive.vn")
            .password("Password@123")
            .fullName("Nguyen Van Test")
            .role(Role.STUDENT)
            .build();

        when(userRepository.existsByEmail("new@edulive.vn")).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("hashed_password");
        when(userRepository.save(any(User.class))).thenReturn(sampleUser);
        when(jwtTokenProvider.generateTokenFromUser(anyLong(), anyString(), anyString())).thenReturn("mocked-jwt");
        when(jwtTokenProvider.getExpirationInMs()).thenReturn(1800000L);
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(i -> i.getArgument(0));
        when(userMapper.toResponse(any(User.class))).thenReturn(
            UserResponse.builder().id(1L).email("new@edulive.vn").fullName("Nguyen Van Test").role(Role.STUDENT).build()
        );

        AuthResponse response = authService.register(request);

        assertNotNull(response);
        assertEquals("mocked-jwt", response.getAccessToken());
        assertNotNull(response.getRefreshToken());
        assertEquals("new@edulive.vn", response.getUser().getEmail());
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    void register_DuplicateEmail_ThrowsException() {
        RegisterRequest request = RegisterRequest.builder()
            .email("existing@edulive.vn")
            .password("Password@123")
            .fullName("Test")
            .build();

        when(userRepository.existsByEmail("existing@edulive.vn")).thenReturn(true);

        assertThrows(AppException.class, () -> authService.register(request));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void login_Success() {
        LoginRequest request = LoginRequest.builder()
            .email("test@edulive.vn")
            .password("Password@123")
            .build();

        when(rateLimiterService.isAllowed(anyString())).thenReturn(true);
        when(userRepository.findByEmail("test@edulive.vn")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("Password@123", sampleUser.getPasswordHash())).thenReturn(true);
        when(jwtTokenProvider.generateTokenFromUser(anyLong(), anyString(), anyString())).thenReturn("mocked-jwt");
        when(jwtTokenProvider.getExpirationInMs()).thenReturn(1800000L);
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(i -> i.getArgument(0));
        when(userMapper.toResponse(sampleUser)).thenReturn(
            UserResponse.builder().id(1L).email("test@edulive.vn").role(Role.STUDENT).build()
        );

        AuthResponse response = authService.login(request, "127.0.0.1");

        assertNotNull(response);
        assertEquals("mocked-jwt", response.getAccessToken());
        verify(rateLimiterService, times(1)).reset(anyString());
    }

    @Test
    void login_WrongPassword_ThrowsException() {
        LoginRequest request = LoginRequest.builder()
            .email("test@edulive.vn")
            .password("WrongPassword")
            .build();

        when(rateLimiterService.isAllowed(anyString())).thenReturn(true);
        when(userRepository.findByEmail("test@edulive.vn")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("WrongPassword", sampleUser.getPasswordHash())).thenReturn(false);

        assertThrows(AppException.class, () -> authService.login(request, "127.0.0.1"));
    }

    @Test
    void login_RateLimited_ThrowsException() {
        LoginRequest request = LoginRequest.builder()
            .email("test@edulive.vn")
            .password("Password@123")
            .build();

        when(rateLimiterService.isAllowed(anyString())).thenReturn(false);

        assertThrows(AppException.class, () -> authService.login(request, "127.0.0.1"));
        verify(userRepository, never()).findByEmail(anyString());
    }
}
