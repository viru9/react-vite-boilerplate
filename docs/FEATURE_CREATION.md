# Feature Creation Guide

This guide walks you through creating a new feature following our established patterns.

## Quick Start

Use the `example-feature` as a template. Copy it and rename to your feature name.

```bash
cp -r src/features/example-feature src/features/your-feature
```

## Step-by-Step Guide

### 1. Create Feature Directory Structure

```
src/features/your-feature/
├── components/          # Feature-specific components
├── hooks/              # Custom hooks
├── services/           # API calls
├── slices/            # Redux slice (if needed)
├── types/             # TypeScript interfaces
└── index.ts           # Public API
```

### 2. Define Types

Create `types/index.ts`:

```typescript
// types/index.ts
export interface YourItem {
  id: string;
  name: string;
  // ... other fields
}

export interface YourState {
  items: YourItem[];
  selectedItem: YourItem | null;
  isLoading: boolean;
  error: string | null;
}

export interface CreateYourItemRequest {
  name: string;
  // ... other fields
}
```

**Best Practices:**
- Use descriptive names
- Separate request/response types
- Export everything that other features need

### 3. Create API Service

Create `services/yourService.ts`:

```typescript
// services/yourService.ts
import { api } from '@/services/api';
import { YourItem, CreateYourItemRequest } from '../types';

export const yourService = {
  getItems: async (): Promise<YourItem[]> => {
    const response = await api.get<YourItem[]>('/your-endpoint/items');
    return response.data;
  },

  getItemById: async (id: string): Promise<YourItem> => {
    const response = await api.get<YourItem>(`/your-endpoint/items/${id}`);
    return response.data;
  },

  createItem: async (data: CreateYourItemRequest): Promise<YourItem> => {
    const response = await api.post<YourItem>('/your-endpoint/items', data);
    return response.data;
  },

  updateItem: async (id: string, data: Partial<YourItem>): Promise<YourItem> => {
    const response = await api.patch<YourItem>(`/your-endpoint/items/${id}`, data);
    return response.data;
  },

  deleteItem: async (id: string): Promise<void> => {
    await api.delete(`/your-endpoint/items/${id}`);
  },
};
```

**Best Practices:**
- Use the shared `api` instance
- Type all parameters and return values
- Use async/await
- Keep services pure (no state mutations)

### 4. Create React Query Hooks

Create `hooks/useYourData.ts`:

```typescript
// hooks/useYourData.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { yourService } from '../services/yourService';
import { CreateYourItemRequest } from '../types';

export const yourKeys = {
  all: ['your-feature'] as const,
  lists: () => [...yourKeys.all, 'list'] as const,
  detail: (id: string) => [...yourKeys.all, 'detail', id] as const,
};

export function useYourItems() {
  return useQuery({
    queryKey: yourKeys.lists(),
    queryFn: yourService.getItems,
  });
}

export function useYourItem(id: string) {
  return useQuery({
    queryKey: yourKeys.detail(id),
    queryFn: () => yourService.getItemById(id),
    enabled: !!id,
  });
}

export function useCreateYourItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateYourItemRequest) => yourService.createItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: yourKeys.lists() });
    },
  });
}

export function useUpdateYourItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<YourItem> }) =>
      yourService.updateItem(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: yourKeys.lists() });
      queryClient.invalidateQueries({ queryKey: yourKeys.detail(id) });
    },
  });
}

export function useDeleteYourItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => yourService.deleteItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: yourKeys.lists() });
    },
  });
}
```

**Best Practices:**
- Define query keys at the top
- Invalidate queries after mutations
- Use optimistic updates for better UX
- Handle errors appropriately

### 5. Create Redux Slice (Optional)

Only create a Redux slice if you need **client-side state** (UI state, selections, preferences).

Create `slices/yourSlice.ts`:

```typescript
// slices/yourSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { YourState, YourItem } from '../types';

const initialState: YourState = {
  items: [],
  selectedItem: null,
  isLoading: false,
  error: null,
};

const yourSlice = createSlice({
  name: 'your-feature',
  initialState,
  reducers: {
    setSelectedItem: (state, action: PayloadAction<YourItem | null>) => {
      state.selectedItem = action.payload;
    },
    clearSelectedItem: (state) => {
      state.selectedItem = null;
    },
  },
});

export const { setSelectedItem, clearSelectedItem } = yourSlice.actions;
export default yourSlice.reducer;
```

**When to use Redux vs React Query:**
- **Redux**: UI state, selections, local preferences
- **React Query**: Server data, API responses, cached data

### 6. Add Reducer to Store

Update `src/app/store.ts`:

```typescript
import yourReducer from '@/features/your-feature/slices/yourSlice';

const rootReducer = combineReducers({
  auth: authReducer,
  example: exampleReducer,
  yourFeature: yourReducer, // Add this
});
```

### 7. Create Components

Create `components/YourList.tsx`:

```typescript
// components/YourList.tsx
import { useYourItems, useDeleteYourItem } from '../hooks/useYourData';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';

export function YourList() {
  const { data: items, isLoading, error } = useYourItems();
  const deleteMutation = useDeleteYourItem();

  if (isLoading) return <Spinner />;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="space-y-4">
      {items?.map((item) => (
        <Card key={item.id}>
          <h3>{item.name}</h3>
          <Button onClick={() => deleteMutation.mutate(item.id)}>
            Delete
          </Button>
        </Card>
      ))}
    </div>
  );
}
```

### 8. Create Public API

Create `index.ts`:

```typescript
// index.ts
export { YourList } from './components/YourList';
export { useYourItems, useYourItem, useCreateYourItem } from './hooks/useYourData';
export { setSelectedItem, clearSelectedItem } from './slices/yourSlice';
export type { YourItem, YourState } from './types';
```

**Best Practices:**
- Only export what other features need
- Keep internal implementations private
- Use named exports for better tree-shaking

### 9. Create Page Component

Create `src/pages/YourFeaturePage.tsx`:

```typescript
// pages/YourFeaturePage.tsx
import { MainLayout } from '@/components/layouts/MainLayout';
import { YourList } from '@/features/your-feature';

export function YourFeaturePage() {
  return (
    <MainLayout>
      <h1>Your Feature</h1>
      <YourList />
    </MainLayout>
  );
}
```

### 10. Add Route

Update `src/app/App.tsx`:

```typescript
const YourFeaturePage = lazy(() =>
  import('@/pages/YourFeaturePage').then((m) => ({ default: m.YourFeaturePage }))
);

// In Routes:
<Route
  path="/your-feature"
  element={
    <ProtectedRoute>
      <YourFeaturePage />
    </ProtectedRoute>
  }
/>
```

## Testing Your Feature

Create `__tests__/yourFeature.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest';
import { renderWithProviders, screen, waitFor } from '@/tests/utils/test-utils';
import { YourList } from '../components/YourList';

describe('YourFeature', () => {
  it('renders list of items', async () => {
    renderWithProviders(<YourList />);
    
    await waitFor(() => {
      expect(screen.getByText('Item 1')).toBeInTheDocument();
    });
  });
});
```

## Checklist

- [ ] Created feature directory structure
- [ ] Defined TypeScript types
- [ ] Created API service
- [ ] Created React Query hooks
- [ ] Created Redux slice (if needed)
- [ ] Added reducer to store (if applicable)
- [ ] Created components
- [ ] Created public API (index.ts)
- [ ] Created page component
- [ ] Added route to App.tsx
- [ ] Added navigation link (if needed)
- [ ] Written tests
- [ ] Updated documentation

## Common Patterns

### Loading States
```typescript
if (isLoading) return <Spinner />;
if (error) return <ErrorMessage error={error} />;
if (!data) return <EmptyState />;
```

### Optimistic Updates
```typescript
const mutation = useMutation({
  mutationFn: updateItem,
  onMutate: async (newData) => {
    await queryClient.cancelQueries({ queryKey: itemKeys.lists() });
    const previous = queryClient.getQueryData(itemKeys.lists());
    queryClient.setQueryData(itemKeys.lists(), (old) => [...old, newData]);
    return { previous };
  },
  onError: (err, newData, context) => {
    queryClient.setQueryData(itemKeys.lists(), context.previous);
  },
});
```

### Form Handling
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
});

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema),
});
```

## Tips

1. **Start simple**: Don't create everything at once
2. **Copy from example**: Use example-feature as a template
3. **Test early**: Write tests as you build
4. **Keep it isolated**: Features shouldn't depend on each other
5. **Document complex logic**: Future you will thank you

