import { api } from './api';
import { 
  AuthResponse, 
  LoginPayload, 
  RegisterPayload, 
  User, 
  UpdateProfilePayload, 
  ChangePasswordPayload 
} from '../types/auth';

export const authService = {
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>('/auth/login', payload);
    return res.data;
  },

  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>('/auth/register', payload);
    return res.data;
  },

  logout: async (refreshToken?: string): Promise<void> => {
    try {
      await api.post('/auth/logout', { refreshToken });
    } catch {
      // Bỏ qua lỗi khi logout
    }
  },

  getMe: async (): Promise<User> => {
    const res = await api.get<User>('/users/me');
    return res.data;
  },

  updateProfile: async (payload: UpdateProfilePayload): Promise<User> => {
    const res = await api.put<User>('/users/profile', payload);
    return res.data;
  },

  changePassword: async (payload: ChangePasswordPayload): Promise<{ message: string }> => {
    const res = await api.put<{ message: string }>('/users/change-password', payload);
    return res.data;
  },
};
