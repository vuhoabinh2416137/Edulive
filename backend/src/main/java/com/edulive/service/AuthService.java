package com.edulive.service;

import com.edulive.dto.auth.AuthResponse;
import com.edulive.dto.auth.LoginRequest;
import com.edulive.dto.auth.RefreshTokenRequest;
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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserMapper userMapper;
    private final RateLimiterService rateLimiterService;

    @Value("${app.jwt.refresh-token-expiration-ms:604800000}")
    private long refreshTokenDurationMs;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AppException("Email đã được đăng ký trong hệ thống", HttpStatus.CONFLICT);
        }

        Role role = request.getRole() != null ? request.getRole() : Role.STUDENT;
        if (role == Role.ADMIN) {
            role = Role.STUDENT; // Không cho phép tự đăng ký tài khoản Admin
        }

        String avatarSeed = request.getEmail().replace("@", "_");
        String avatarUrl = "https://api.dicebear.com/7.x/avataaars/svg?seed=" + avatarSeed;

        User user = User.builder()
            .email(request.getEmail().toLowerCase().trim())
            .passwordHash(passwordEncoder.encode(request.getPassword()))
            .fullName(request.getFullName().trim())
            .avatarUrl(avatarUrl)
            .role(role)
            .status(UserStatus.ACTIVE)
            .build();

        User savedUser = userRepository.save(user);

        String accessToken = jwtTokenProvider.generateTokenFromUser(
            savedUser.getId(), savedUser.getEmail(), savedUser.getRole().name()
        );
        RefreshToken refreshToken = createRefreshToken(savedUser);

        UserResponse userResponse = userMapper.toResponse(savedUser);

        return AuthResponse.builder()
            .accessToken(accessToken)
            .refreshToken(refreshToken.getToken())
            .tokenType("Bearer")
            .expiresInMs(jwtTokenProvider.getExpirationInMs())
            .user(userResponse)
            .build();
    }

    @Transactional
    public AuthResponse login(LoginRequest request, String clientIp) {
        String rateLimitKey = clientIp + "_" + request.getEmail().toLowerCase();
        if (!rateLimiterService.isAllowed(rateLimitKey)) {
            throw new AppException("Bạn đã thử đăng nhập quá nhiều lần. Vui lòng thử lại sau 1 phút.", HttpStatus.TOO_MANY_REQUESTS);
        }

        User user = userRepository.findByEmail(request.getEmail().toLowerCase().trim())
            .orElseThrow(() -> new AppException("Email hoặc mật khẩu không chính xác", HttpStatus.UNAUTHORIZED));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new AppException("Email hoặc mật khẩu không chính xác", HttpStatus.UNAUTHORIZED);
        }

        if (user.getStatus() == UserStatus.LOCKED) {
            throw new AppException("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.", HttpStatus.FORBIDDEN);
        }

        // Đăng nhập thành công -> reset rate limit
        rateLimiterService.reset(rateLimitKey);

        String accessToken = jwtTokenProvider.generateTokenFromUser(
            user.getId(), user.getEmail(), user.getRole().name()
        );
        RefreshToken refreshToken = createRefreshToken(user);

        UserResponse userResponse = userMapper.toResponse(user);

        return AuthResponse.builder()
            .accessToken(accessToken)
            .refreshToken(refreshToken.getToken())
            .tokenType("Bearer")
            .expiresInMs(jwtTokenProvider.getExpirationInMs())
            .user(userResponse)
            .build();
    }

    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(request.getRefreshToken())
            .orElseThrow(() -> new AppException("Refresh token không hợp lệ hoặc không tồn tại", HttpStatus.UNAUTHORIZED));

        if (refreshToken.isRevoked()) {
            throw new AppException("Refresh token đã bị thu hồi", HttpStatus.UNAUTHORIZED);
        }

        if (refreshToken.getExpiryDate().isBefore(Instant.now())) {
            refreshTokenRepository.delete(refreshToken);
            throw new AppException("Refresh token đã hết hạn. Vui lòng đăng nhập lại.", HttpStatus.UNAUTHORIZED);
        }

        User user = refreshToken.getUser();
        if (user.getStatus() == UserStatus.LOCKED) {
            throw new AppException("Tài khoản đã bị khóa", HttpStatus.FORBIDDEN);
        }

        String newAccessToken = jwtTokenProvider.generateTokenFromUser(
            user.getId(), user.getEmail(), user.getRole().name()
        );

        UserResponse userResponse = userMapper.toResponse(user);

        return AuthResponse.builder()
            .accessToken(newAccessToken)
            .refreshToken(refreshToken.getToken())
            .tokenType("Bearer")
            .expiresInMs(jwtTokenProvider.getExpirationInMs())
            .user(userResponse)
            .build();
    }

    @Transactional
    public void logout(String refreshTokenStr) {
        if (refreshTokenStr != null) {
            refreshTokenRepository.findByToken(refreshTokenStr).ifPresent(token -> {
                token.setRevoked(true);
                refreshTokenRepository.save(token);
            });
        }
    }

    private RefreshToken createRefreshToken(User user) {
        RefreshToken refreshToken = RefreshToken.builder()
            .user(user)
            .token(UUID.randomUUID().toString())
            .expiryDate(Instant.now().plusMillis(refreshTokenDurationMs))
            .revoked(false)
            .build();
        return refreshTokenRepository.save(refreshToken);
    }
}
