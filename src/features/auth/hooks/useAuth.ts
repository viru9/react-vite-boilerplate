import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import {
  loginUser,
  registerUser,
  logoutUser,
  clearCredentials,
  clearError,
} from '../slices/authSlice';
import type { LoginRequest, RegisterRequest } from '../types';

/**
 * Custom hook for authentication
 * Provides easy access to auth state and actions
 */
export const useAuth = () => {
  const dispatch = useAppDispatch();
  const auth = useAppSelector((state) => state.auth);

  const login = useCallback(
    async (credentials: LoginRequest) => {
      const result = await dispatch(loginUser(credentials));
      return result;
    },
    [dispatch]
  );

  const register = useCallback(
    async (userData: RegisterRequest) => {
      const result = await dispatch(registerUser(userData));
      return result;
    },
    [dispatch]
  );

  const logout = useCallback(async () => {
    await dispatch(logoutUser());
  }, [dispatch]);

  const clearAuthError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  const forceLogout = useCallback(() => {
    dispatch(clearCredentials());
  }, [dispatch]);

  return {
    // State
    user: auth.user,
    token: auth.token,
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    error: auth.error,

    // Actions
    login,
    register,
    logout,
    clearAuthError,
    forceLogout,
  };
};

