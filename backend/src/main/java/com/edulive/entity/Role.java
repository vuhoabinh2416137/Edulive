package com.edulive.entity;

public enum Role {
    ADMIN,
    LECTURER,
    STUDENT;

    public String getAuthority() {
        return "ROLE_" + this.name();
    }
}
