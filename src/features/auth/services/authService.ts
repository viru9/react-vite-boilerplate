import { api } from '@/services/api';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  ForgotPasswordResponse,
  ResetPasswordResponse,
  User,
} from '../types';

/**
 * Authentication Service
 * All API calls related to authentication
 */

export const authService = {
  /**
   * Login user
   */
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/login', credentials);
    return response.data;
  },

  /**
   * Register new user
   */
  register: async (userData: RegisterRequest): Promise<RegisterResponse> => {
    const response = await api.post<RegisterResponse>(
      '/auth/register',
      userData
    );
    return response.data;
  },

  /**
   * Logout user
   */
  logout: async (refreshToken: string): Promise<void> => {
    await api.post('/auth/logout', { refreshToken });
  },

  /**
   * Get current user profile
   */
  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },

  /**
   * Refresh access token
   */
  refreshToken: async (refreshToken: string): Promise<{ token: string }> => {
    const response = await api.post<{ token: string }>('/auth/refresh', {
      refreshToken,
    });
    return response.data;
  },

  /**
   * Request password reset
   */
  forgotPassword: async (email: string): Promise<ForgotPasswordResponse> => {
    const response = await api.post<ForgotPasswordResponse>(
      '/auth/forgot-password',
      { email }
    );
    return response.data;
  },

  /**
   * Reset password with token
   */
  resetPassword: async (
    token: string,
    password: string
  ): Promise<ResetPasswordResponse> => {
    const response = await api.post<ResetPasswordResponse>(
      '/auth/reset-password',
      { token, password }
    );
    return response.data;
  },
};

