import { QueryClient } from '@tanstack/react-query';

/**
 * React Query Client Configuration
 * Centralized configuration for data fetching, caching, and state management
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 5 minutes
      staleTime: 5 * 60 * 1000,
      
      // Cache data for 10 minutes
      gcTime: 10 * 60 * 1000,
      
      // Retry failed requests once
      retry: 1,
      
      // Don't refetch on window focus in development
      refetchOnWindowFocus: import.meta.env.PROD,
      
      // Refetch on mount if data is stale
      refetchOnMount: true,
      
      // Don't refetch on reconnect
      refetchOnReconnect: false,
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
    },
  },
});

