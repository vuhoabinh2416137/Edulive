package com.edulive.websocket;

import com.edulive.security.CustomUserDetailsService;
import com.edulive.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private final JwtTokenProvider tokenProvider;
    private final CustomUserDetailsService customUserDetailsService;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            String token = extractToken(accessor);

            if (StringUtils.hasText(token) && tokenProvider.validateToken(token)) {
                try {
                    Long userId = tokenProvider.getUserIdFromJWT(token);
                    UserDetails userDetails = customUserDetailsService.loadUserById(userId);
                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                    accessor.setUser(authentication);
                    log.info("WebSocket connection authenticated for user: {}", userDetails.getUsername());
                } catch (Exception ex) {
                    log.error("Failed to authenticate user via WebSocket JWT: {}", ex.getMessage());
                }
            } else {
                log.warn("WebSocket CONNECT frame without valid JWT token");
            }
        }

        return message;
    }

    private String extractToken(StompHeaderAccessor accessor) {
        // Try Authorization header
        String authHeader = accessor.getFirstNativeHeader("Authorization");
        if (StringUtils.hasText(authHeader) && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }

        // Try direct 'token' parameter
        String tokenParam = accessor.getFirstNativeHeader("token");
        if (StringUtils.hasText(tokenParam)) {
            return tokenParam;
        }

        return null;
    }
}
