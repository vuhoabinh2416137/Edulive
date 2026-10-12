package com.edulive.mapper;

import com.edulive.dto.user.UserResponse;
import com.edulive.entity.User;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-10-10T20:17:58+0700",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 17.0.18 (Microsoft)"
)
@Component
public class UserMapperImpl implements UserMapper {

    @Override
    public UserResponse toResponse(User user) {
        if ( user == null ) {
            return null;
        }

        UserResponse.UserResponseBuilder userResponse = UserResponse.builder();

        userResponse.id( user.getId() );
        userResponse.email( user.getEmail() );
        userResponse.fullName( user.getFullName() );
        userResponse.avatarUrl( user.getAvatarUrl() );
        userResponse.role( user.getRole() );
        userResponse.status( user.getStatus() );
        userResponse.createdAt( user.getCreatedAt() );

        return userResponse.build();
    }
}
