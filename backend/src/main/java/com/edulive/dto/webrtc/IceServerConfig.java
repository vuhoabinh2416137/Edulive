package com.edulive.dto.webrtc;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IceServerConfig {
    private List<String> urls;
    private String username;
    private String credential;
}
