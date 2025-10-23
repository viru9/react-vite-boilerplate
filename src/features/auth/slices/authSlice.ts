import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { authService } from '../services/authService';
import type {
  AuthState,
  LoginRequest,
  RegisterRequest,
  LoginResponse,
} from '../types';
import { getErrorMessage } from '@/services/api';

/**
 * Initial state for authentication
 */
const initialState: AuthState = {
  user: null,
  token: localStorage.getItem(
    import.meta.env.VITE_TOKEN_KEY || 'auth_token'
  ),
  refreshToken: localStorage.getItem(
    import.meta.env.VITE_REFRESH_TOKEN_KEY || 'refresh_token'
  ),
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

/**
 * Async thunk for user login
 */
export const loginUser = createAsyncThunk<
  LoginResponse,
  LoginRequest,
  { rejectValue: string }
>('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const response = await authService.login(credentials);
    return response;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

/**
 * Async thunk for user registration
 */
export const registerUser = createAsyncThunk<
  LoginResponse,
  RegisterRequest,
  { rejectValue: string }
>('auth/register', async (userData, { rejectWithValue }) => {
  try {
    const response = await authService.register(userData);
    return response;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

/**
 * Async thunk for user logout
 */
export const logoutUser = createAsyncThunk<void, void, { rejectValue: string }>(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authService.logout();
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

/**
 * Auth slice
 */
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{
        user: AuthState['user'];
        token: string;
        refreshToken: string;
      }>
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = true;

      // Persist tokens
      localStorage.setItem(
        import.meta.env.VITE_TOKEN_KEY || 'auth_token',
        action.payload.token
      );
      localStorage.setItem(
        import.meta.env.VITE_REFRESH_TOKEN_KEY || 'refresh_token',
        action.payload.refreshToken
      );
    },
    clearCredentials: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.error = null;

      // Clear tokens
      localStorage.removeItem(import.meta.env.VITE_TOKEN_KEY || 'auth_token');
      localStorage.removeItem(
        import.meta.env.VITE_REFRESH_TOKEN_KEY || 'refresh_token'
      );
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;

        // Persist tokens
        localStorage.setItem(
          import.meta.env.VITE_TOKEN_KEY || 'auth_token',
          action.payload.token
        );
        localStorage.setItem(
          import.meta.env.VITE_REFRESH_TOKEN_KEY || 'refresh_token',
          action.payload.refreshToken
        );
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Login failed';
      });

    // Register
    builder
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;

        // Persist tokens
        localStorage.setItem(
          import.meta.env.VITE_TOKEN_KEY || 'auth_token',
          action.payload.token
        );
        localStorage.setItem(
          import.meta.env.VITE_REFRESH_TOKEN_KEY || 'refresh_token',
          action.payload.refreshToken
        );
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Registration failed';
      });

    // Logout
    builder
      .addCase(logoutUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;

        // Clear tokens
        localStorage.removeItem(
          import.meta.env.VITE_TOKEN_KEY || 'auth_token'
        );
        localStorage.removeItem(
          import.meta.env.VITE_REFRESH_TOKEN_KEY || 'refresh_token'
        );
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Logout failed';
      });
  },
});

export const { setCredentials, clearCredentials, clearError } =
  authSlice.actions;
export default authSlice.reducer;

