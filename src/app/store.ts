import { configureStore, combineReducers } from '@reduxjs/toolkit';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import authReducer from '@/features/auth/slices/authSlice';
import exampleReducer from '@/features/example-feature/slices/exampleSlice';

/**
 * Redux Persist Configuration
 */
const persistConfig = {
  key: 'root',
  version: 1,
  storage,
  // Whitelist state slices to persist
  whitelist: ['auth'],
};

/**
 * Root Reducer combining all feature reducers
 */
const rootReducer = combineReducers({
  auth: authReducer,
  example: exampleReducer,
  // Add more feature reducers here
});

/**
 * Persisted Reducer
 */
const persistedReducer = persistReducer(persistConfig, rootReducer);

/**
 * Configure Store
 */
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore redux-persist actions
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
  devTools: import.meta.env.DEV,
});

/**
 * Persistor for redux-persist
 */
export const persistor = persistStore(store);

/**
 * TypeScript Types
 */
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

