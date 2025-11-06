import axios, { AxiosError } from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import axiosRetry from 'axios-retry';

/**
 * Axios instance with base configuration
 */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1',
  timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Configure retry logic for failed requests
 */
axiosRetry(api, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error: AxiosError) => {
    // Retry on network errors or 5xx server errors
    return (
      axiosRetry.isNetworkOrIdempotentRequestError(error) ||
      (error.response?.status ?? 0) >= 500
    );
  },
});

/**
 * Request interceptor - Add auth token to requests
 */
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(
      import.meta.env.VITE_TOKEN_KEY || 'auth_token'
    );

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - Handle errors globally
 */
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Handle 401 Unauthorized - Token refresh logic
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem(
          import.meta.env.VITE_REFRESH_TOKEN_KEY || 'refresh_token'
        );

        if (refreshToken) {
          // Call refresh token endpoint
          const response = await axios.post(
            `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1'}/auth/refresh`,
            { refreshToken }
          );

          const { token } = response.data;
          localStorage.setItem(
            import.meta.env.VITE_TOKEN_KEY || 'auth_token',
            token
          );

          // Retry the original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed - logout user
        localStorage.removeItem(
          import.meta.env.VITE_TOKEN_KEY || 'auth_token'
        );
        localStorage.removeItem(
          import.meta.env.VITE_REFRESH_TOKEN_KEY || 'refresh_token'
        );
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Log errors in development
    if (import.meta.env.DEV) {
      console.error('API Error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
    }

    return Promise.reject(error);
  }
);

/**
 * API Error type for better error handling
 */
export interface ApiError {
  message: string;
  status?: number;
  data?: unknown;
}

/**
 * Helper to extract error message from API errors
 */
export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    return (
      (error.response?.data as { message?: string })?.message ||
      error.message ||
      'An unexpected error occurred'
    );
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

