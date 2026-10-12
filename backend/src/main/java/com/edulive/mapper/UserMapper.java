package com.edulive.mapper;

import com.edulive.dto.user.UserResponse;
import com.edulive.entity.User;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface UserMapper {

    UserResponse toResponse(User user);
}
