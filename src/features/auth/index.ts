/**
 * Auth Feature Public API
 * Export only what other parts of the app need to access
 */

// Components
export { LoginForm } from './components/LoginForm';
export { RegisterForm } from './components/RegisterForm';

// Hooks
export { useAuth } from './hooks/useAuth';

// Types
export type {
  User,
  AuthState,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
} from './types';

// Redux Actions
export {
  loginUser,
  registerUser,
  logoutUser,
  setCredentials,
  clearCredentials,
  clearError,
} from './slices/authSlice';

