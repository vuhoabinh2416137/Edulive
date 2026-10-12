export type Role = 'ADMIN' | 'LECTURER' | 'STUDENT';
export type UserStatus = 'ACTIVE' | 'LOCKED';

export interface User {
  id: number;
  email: string;
  fullName: string;
  avatarUrl?: string;
  role: Role;
  status: UserStatus;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresInMs: number;
  user: User;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  fullName: string;
  role?: Role;
}

export interface UpdateProfilePayload {
  fullName: string;
  avatarUrl?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}
