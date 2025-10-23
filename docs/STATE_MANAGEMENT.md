# State Management Guide

This boilerplate uses a **hybrid approach**: Redux Toolkit for client state and React Query for server state.

## When to Use What

### Use Redux Toolkit For:

- ✅ **Client-side UI state**
  - Selected items (tabs, rows, filters)
  - UI preferences (sidebar open/closed, theme)
  - Modal/dialog state
  - Form draft data (autosave)

- ✅ **Authentication state**
  - User information
  - Tokens
  - Permissions

- ✅ **Cross-feature state**
  - State needed by multiple unrelated features
  - Global application state

### Use React Query For:

- ✅ **Server data**
  - API responses
  - Database records
  - External data sources

- ✅ **Data that needs caching**
  - Lists, details, search results
  - Data that changes on the server

- ✅ **Background synchronization**
  - Auto-refreshing data
  - Polling
  - Real-time updates

## Redux Toolkit Patterns

### 1. Creating a Slice

```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  notifications: string[];
}

const initialState: UIState = {
  sidebarOpen: true,
  theme: 'light',
  notifications: [],
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
    addNotification: (state, action: PayloadAction<string>) => {
      state.notifications.push(action.payload);
    },
    removeNotification: (state, action: PayloadAction<number>) => {
      state.notifications.splice(action.payload, 1);
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
  },
});

export const {
  toggleSidebar,
  setTheme,
  addNotification,
  removeNotification,
  clearNotifications,
} = uiSlice.actions;

export default uiSlice.reducer;
```

### 2. Using Redux in Components

```typescript
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import { toggleSidebar, setTheme } from '@/features/ui/slices/uiSlice';

function Header() {
  const dispatch = useAppDispatch();
  const { sidebarOpen, theme } = useAppSelector((state) => state.ui);

  const handleToggleSidebar = () => {
    dispatch(toggleSidebar());
  };

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    dispatch(setTheme(newTheme));
  };

  return (
    <header>
      <button onClick={handleToggleSidebar}>
        {sidebarOpen ? 'Close' : 'Open'} Sidebar
      </button>
      <button onClick={() => handleThemeChange(theme === 'light' ? 'dark' : 'light')}>
        Toggle Theme
      </button>
    </header>
  );
}
```

### 3. Async Thunks (When You Really Need Them)

**Note**: Prefer React Query for API calls. Use thunks only for complex client-side async logic.

```typescript
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

export const processData = createAsyncThunk(
  'data/process',
  async (data: SomeData, { rejectWithValue }) => {
    try {
      // Complex client-side processing
      const processed = await heavyProcessing(data);
      return processed;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const dataSlice = createSlice({
  name: 'data',
  initialState: { processed: null, isProcessing: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(processData.pending, (state) => {
        state.isProcessing = true;
        state.error = null;
      })
      .addCase(processData.fulfilled, (state, action) => {
        state.isProcessing = false;
        state.processed = action.payload;
      })
      .addCase(processData.rejected, (state, action) => {
        state.isProcessing = false;
        state.error = action.payload as string;
      });
  },
});
```

### 4. Redux Persist

State is automatically persisted. Configure in `store.ts`:

```typescript
const persistConfig = {
  key: 'root',
  version: 1,
  storage,
  whitelist: ['auth', 'ui'], // Only persist these slices
  blacklist: ['temporary'], // Never persist these
};
```

## React Query Patterns

### 1. Fetching Data

```typescript
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';

function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get('/users');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

function UserList() {
  const { data, isLoading, error } = useUsers();

  if (isLoading) return <Spinner />;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {data?.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

### 2. Mutations (Create, Update, Delete)

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';

function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userData: CreateUserData) => {
      const response = await api.post('/users', userData);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch users list
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error) => {
      console.error('Failed to create user:', error);
    },
  });
}

function CreateUserForm() {
  const createUser = useCreateUser();

  const handleSubmit = async (data: CreateUserData) => {
    try {
      await createUser.mutateAsync(data);
      // Success! Query was invalidated and refetched
    } catch (error) {
      // Error handled
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button disabled={createUser.isPending}>
        {createUser.isPending ? 'Creating...' : 'Create User'}
      </button>
    </form>
  );
}
```

### 3. Optimistic Updates

```typescript
function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateUserData }) => {
      const response = await api.patch(`/users/${id}`, data);
      return response.data;
    },
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['users'] });

      // Snapshot previous value
      const previousUsers = queryClient.getQueryData(['users']);

      // Optimistically update
      queryClient.setQueryData(['users'], (old: User[]) =>
        old.map((user) => (user.id === id ? { ...user, ...data } : user))
      );

      return { previousUsers };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousUsers) {
        queryClient.setQueryData(['users'], context.previousUsers);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
```

### 4. Dependent Queries

```typescript
function useUserPosts(userId: string | undefined) {
  return useQuery({
    queryKey: ['users', userId, 'posts'],
    queryFn: async () => {
      const response = await api.get(`/users/${userId}/posts`);
      return response.data;
    },
    enabled: !!userId, // Only run if userId exists
  });
}

function UserProfile({ userId }: { userId?: string }) {
  const { data: user } = useUser(userId);
  const { data: posts } = useUserPosts(user?.id); // Runs after user is loaded

  return <div>{/* render user and posts */}</div>;
}
```

### 5. Pagination

```typescript
function useUsersPaginated(page: number) {
  return useQuery({
    queryKey: ['users', 'paginated', page],
    queryFn: async () => {
      const response = await api.get(`/users?page=${page}`);
      return response.data;
    },
    keepPreviousData: true, // Keep showing old data while fetching new page
  });
}

function UsersPaginated() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isPreviousData } = useUsersPaginated(page);

  return (
    <div>
      {isLoading ? <Spinner /> : <UserList users={data.users} />}
      <button
        onClick={() => setPage((old) => Math.max(old - 1, 1))}
        disabled={page === 1}
      >
        Previous
      </button>
      <button
        onClick={() => setPage((old) => old + 1)}
        disabled={isPreviousData || !data?.hasMore}
      >
        Next
      </button>
    </div>
  );
}
```

### 6. Infinite Queries

```typescript
function useInfiniteUsers() {
  return useInfiniteQuery({
    queryKey: ['users', 'infinite'],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await api.get(`/users?page=${pageParam}`);
      return response.data;
    },
    getNextPageParam: (lastPage, pages) => {
      return lastPage.hasMore ? pages.length + 1 : undefined;
    },
  });
}

function InfiniteUserList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteUsers();

  return (
    <div>
      {data?.pages.map((page, i) => (
        <React.Fragment key={i}>
          {page.users.map((user) => (
            <UserCard key={user.id} user={user} />
          ))}
        </React.Fragment>
      ))}
      <button
        onClick={() => fetchNextPage()}
        disabled={!hasNextPage || isFetchingNextPage}
      >
        {isFetchingNextPage ? 'Loading more...' : 'Load More'}
      </button>
    </div>
  );
}
```

## Query Key Organization

```typescript
// Organize query keys hierarchically
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters: string) => [...userKeys.lists(), { filters }] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
  posts: (id: string) => [...userKeys.detail(id), 'posts'] as const,
};

// Usage
useQuery({ queryKey: userKeys.detail('123'), ... });
useQuery({ queryKey: userKeys.posts('123'), ... });

// Invalidate all user queries
queryClient.invalidateQueries({ queryKey: userKeys.all });

// Invalidate only lists
queryClient.invalidateQueries({ queryKey: userKeys.lists() });
```

## Combining Redux and React Query

```typescript
function UserDashboard() {
  // React Query for server data
  const { data: users, isLoading } = useUsers();
  const { data: posts } = usePosts();

  // Redux for client state
  const dispatch = useAppDispatch();
  const selectedUserId = useAppSelector((state) => state.ui.selectedUserId);

  const handleSelectUser = (userId: string) => {
    dispatch(setSelectedUser(userId));
  };

  if (isLoading) return <Spinner />;

  return (
    <div>
      <UserList
        users={users}
        selectedId={selectedUserId}
        onSelect={handleSelectUser}
      />
      {selectedUserId && <UserPosts userId={selectedUserId} posts={posts} />}
    </div>
  );
}
```

## Best Practices

### Redux
1. **Keep it minimal**: Only store what needs to be in Redux
2. **Normalize data**: Use normalized state shape for complex data
3. **Use selectors**: Create reusable selectors for derived state
4. **Immer inside**: Redux Toolkit uses Immer, write "mutating" code

### React Query
1. **Set proper staleTime**: Balance freshness and performance
2. **Use query keys wisely**: Hierarchical structure for easy invalidation
3. **Handle loading states**: Show spinners, skeletons, or previous data
4. **Optimistic updates**: Better UX for mutations
5. **Error handling**: Display user-friendly error messages

## Debugging

### Redux DevTools

```typescript
// Already enabled in store.ts
devTools: import.meta.env.DEV
```

Access in browser: Redux DevTools Extension

### React Query DevTools

```typescript
// Already enabled in providers.tsx (development only)
{import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
```

Access: Bottom-left floating button in development

## Common Pitfalls

❌ **Don't**: Store server data in Redux
```typescript
// Bad
const usersSlice = createSlice({
  name: 'users',
  initialState: { users: [], loading: false },
  reducers: {
    setUsers: (state, action) => {
      state.users = action.payload;
    },
  },
});
```

✅ **Do**: Use React Query
```typescript
// Good
const { data: users } = useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers,
});
```

❌ **Don't**: Use React Query for UI state
```typescript
// Bad
const { data: sidebarOpen } = useQuery({
  queryKey: ['sidebar'],
  queryFn: () => localStorage.getItem('sidebar') === 'open',
});
```

✅ **Do**: Use Redux
```typescript
// Good
const sidebarOpen = useAppSelector((state) => state.ui.sidebarOpen);
```

## Migration Guide

If you need to migrate from all-Redux to this hybrid approach:

1. Identify server data in Redux → Move to React Query
2. Keep UI/client state in Redux
3. Update components to use appropriate hooks
4. Remove unnecessary Redux slices
5. Update tests

## Resources

- [Redux Toolkit Documentation](https://redux-toolkit.js.org/)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Redux Persist](https://github.com/rt2zz/redux-persist)

