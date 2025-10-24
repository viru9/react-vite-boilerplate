import { type ReactNode } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { BrowserRouter } from 'react-router-dom';
import { store, persistor } from './store';
import { queryClient } from '@/services/queryClient';

interface ProvidersProps {
  children: ReactNode;
}

/**
 * All Providers Wrapper
 * Wraps the app with Redux, React Query, and Router providers
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>{children}</BrowserRouter>
          {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
        </QueryClientProvider>
      </PersistGate>
    </Provider>
  );
}

