# API Guidelines

This guide covers making API calls, error handling, and best practices for working with backend services.

## API Configuration

### Base Setup

The API client is configured in `src/services/api.ts`:

```typescript
import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

### Environment Variables

Create `.env` file (copy from `.env.example`):

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_API_TIMEOUT=10000
VITE_TOKEN_KEY=auth_token
VITE_REFRESH_TOKEN_KEY=refresh_token
```

## Making API Calls

### 1. Create a Service

Always create a service file for feature-related API calls:

```typescript
// src/features/posts/services/postService.ts
import { api } from '@/services/api';
import { Post, CreatePostRequest, UpdatePostRequest } from '../types';

export const postService = {
  // GET list
  getPosts: async (): Promise<Post[]> => {
    const response = await api.get<Post[]>('/posts');
    return response.data;
  },

  // GET by ID
  getPostById: async (id: string): Promise<Post> => {
    const response = await api.get<Post>(`/posts/${id}`);
    return response.data;
  },

  // POST create
  createPost: async (data: CreatePostRequest): Promise<Post> => {
    const response = await api.post<Post>('/posts', data);
    return response.data;
  },

  // PATCH update
  updatePost: async (id: string, data: UpdatePostRequest): Promise<Post> => {
    const response = await api.patch<Post>(`/posts/${id}`, data);
    return response.data;
  },

  // DELETE
  deletePost: async (id: string): Promise<void> => {
    await api.delete(`/posts/${id}`);
  },

  // Query parameters
  searchPosts: async (query: string, filters: PostFilters): Promise<Post[]> => {
    const response = await api.get<Post[]>('/posts/search', {
      params: { q: query, ...filters },
    });
    return response.data;
  },
};
```

### 2. Use with React Query

```typescript
// src/features/posts/hooks/usePostData.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { postService } from '../services/postService';

export const postKeys = {
  all: ['posts'] as const,
  lists: () => [...postKeys.all, 'list'] as const,
  detail: (id: string) => [...postKeys.all, 'detail', id] as const,
};

export function usePosts() {
  return useQuery({
    queryKey: postKeys.lists(),
    queryFn: postService.getPosts,
  });
}

export function usePost(id: string) {
  return useQuery({
    queryKey: postKeys.detail(id),
    queryFn: () => postService.getPostById(id),
    enabled: !!id,
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postService.createPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
    },
  });
}
```

## Authentication

### Automatic Token Handling

Tokens are automatically added to requests via interceptor:

```typescript
// In api.ts
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Token Refresh

Automatic token refresh on 401 errors:

```typescript
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const response = await axios.post('/auth/refresh', { refreshToken });
        const { token } = response.data;

        localStorage.setItem('auth_token', token);
        originalRequest.headers.Authorization = `Bearer ${token}`;

        return api(originalRequest);
      } catch (refreshError) {
        // Redirect to login
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
```

## Error Handling

### Global Error Handling

Errors are intercepted globally:

```typescript
api.interceptors.response.use(
  (response) => response,
  (error) => {
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
```

### Component-Level Error Handling

```typescript
function PostList() {
  const { data, isLoading, error } = usePosts();

  if (isLoading) return <Spinner />;
  
  if (error) {
    return (
      <ErrorMessage>
        {getErrorMessage(error)}
      </ErrorMessage>
    );
  }

  return <div>{/* render posts */}</div>;
}
```

### Extract Error Messages

```typescript
// In api.ts
export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred'
    );
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

// Usage
try {
  await createPost(data);
} catch (error) {
  toast.error(getErrorMessage(error));
}
```

### Typed Error Responses

```typescript
interface ApiError {
  message: string;
  code?: string;
  field?: string;
}

export const getApiError = (error: unknown): ApiError => {
  if (axios.isAxiosError(error) && error.response?.data) {
    return error.response.data as ApiError;
  }
  return { message: 'An unexpected error occurred' };
};
```

## Request Patterns

### Query Parameters

```typescript
// Simple
api.get('/posts', { params: { page: 1, limit: 10 } });

// Complex filters
api.get('/posts', {
  params: {
    category: ['tech', 'news'],
    dateFrom: '2024-01-01',
    sort: 'desc',
  },
  paramsSerializer: (params) => {
    return qs.stringify(params, { arrayFormat: 'repeat' });
  },
});
```

### Request Body

```typescript
// JSON
api.post('/posts', {
  title: 'My Post',
  content: 'Content here',
});

// FormData (for file uploads)
const formData = new FormData();
formData.append('file', file);
formData.append('title', title);

api.post('/posts', formData, {
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});
```

### Custom Headers

```typescript
api.get('/posts', {
  headers: {
    'X-Custom-Header': 'value',
  },
});
```

### Abort Requests

```typescript
function SearchPosts() {
  const [query, setQuery] = useState('');

  const { data } = useQuery({
    queryKey: ['posts', 'search', query],
    queryFn: async ({ signal }) => {
      const response = await api.get('/posts/search', {
        params: { q: query },
        signal, // Pass abort signal
      });
      return response.data;
    },
    enabled: query.length > 2,
  });

  return <div>{/* render search results */}</div>;
}
```

## Retry Logic

Automatic retries are configured:

```typescript
import axiosRetry from 'axios-retry';

axiosRetry(api, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    return (
      axiosRetry.isNetworkOrIdempotentRequestError(error) ||
      (error.response?.status ?? 0) >= 500
    );
  },
});
```

### Custom Retry Logic

```typescript
// In React Query
useQuery({
  queryKey: ['posts'],
  queryFn: fetchPosts,
  retry: (failureCount, error) => {
    // Don't retry on 404
    if (error.response?.status === 404) return false;
    // Retry up to 3 times
    return failureCount < 3;
  },
  retryDelay: (attemptIndex) => {
    // Exponential backoff
    return Math.min(1000 * 2 ** attemptIndex, 30000);
  },
});
```

## Caching Strategy

### React Query Configuration

```typescript
// In queryClient.ts
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
```

### Per-Query Caching

```typescript
// Long-lived data (rarely changes)
useQuery({
  queryKey: ['config'],
  queryFn: fetchConfig,
  staleTime: Infinity, // Never goes stale
  gcTime: Infinity, // Never garbage collected
});

// Real-time data (always fresh)
useQuery({
  queryKey: ['notifications'],
  queryFn: fetchNotifications,
  staleTime: 0, // Always stale
  refetchInterval: 30000, // Refetch every 30 seconds
});

// User-specific data
useQuery({
  queryKey: ['user', userId],
  queryFn: () => fetchUser(userId),
  staleTime: 5 * 60 * 1000,
});
```

## File Uploads

```typescript
export const uploadService = {
  uploadFile: async (file: File, onProgress?: (progress: number) => void) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = (progressEvent.loaded / progressEvent.total) * 100;
          onProgress(Math.round(progress));
        }
      },
    });

    return response.data;
  },
};

// Usage
function FileUpload() {
  const [progress, setProgress] = useState(0);
  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadService.uploadFile(file, setProgress),
  });

  const handleUpload = (file: File) => {
    uploadMutation.mutate(file);
  };

  return (
    <div>
      <input type="file" onChange={(e) => handleUpload(e.target.files[0])} />
      {uploadMutation.isPending && <ProgressBar value={progress} />}
    </div>
  );
}
```

## Polling

```typescript
// Auto-refresh every 30 seconds
useQuery({
  queryKey: ['dashboard', 'stats'],
  queryFn: fetchDashboardStats,
  refetchInterval: 30000,
  refetchIntervalInBackground: false, // Stop when tab is not active
});

// Conditional polling
useQuery({
  queryKey: ['job', jobId],
  queryFn: () => fetchJobStatus(jobId),
  refetchInterval: (data) => {
    // Stop polling when job is complete
    return data?.status === 'completed' ? false : 5000;
  },
});
```

## Best Practices

1. **Type everything**: Define interfaces for requests and responses
2. **Use services**: Don't call API directly from components
3. **Handle errors**: Always handle error states in UI
4. **Cache wisely**: Set appropriate staleTime based on data volatility
5. **Abort requests**: Use abort signals for expensive operations
6. **Retry strategically**: Don't retry on client errors (4xx)
7. **Loading states**: Show feedback during async operations
8. **Optimistic updates**: Update UI before server confirms
9. **Error recovery**: Provide retry options to users
10. **Logging**: Log errors in development, use error tracking in production

## Testing API Calls

Use MSW (Mock Service Worker):

```typescript
// tests/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/posts', () => {
    return HttpResponse.json([
      { id: '1', title: 'Post 1' },
      { id: '2', title: 'Post 2' },
    ]);
  }),

  http.post('/api/posts', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ id: '3', ...body });
  }),
];
```

## Common Patterns

### Dependent Requests

```typescript
function UserPosts({ userId }: { userId: string }) {
  const { data: user } = useUser(userId);
  const { data: posts } = usePosts(user?.id); // Waits for user

  return <div>{/* render */}</div>;
}
```

### Parallel Requests

```typescript
function Dashboard() {
  const users = useUsers();
  const posts = usePosts();
  const comments = useComments();

  // All fetch in parallel
  if (users.isLoading || posts.isLoading || comments.isLoading) {
    return <Spinner />;
  }

  return <div>{/* render */}</div>;
}
```

### Conditional Requests

```typescript
function PostDetails({ postId }: { postId?: string }) {
  const { data } = useQuery({
    queryKey: ['posts', postId],
    queryFn: () => fetchPost(postId!),
    enabled: !!postId, // Only run if postId exists
  });

  return <div>{/* render */}</div>;
}
```

