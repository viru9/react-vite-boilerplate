# Testing Guide

This boilerplate uses **Vitest** and **React Testing Library** for testing, with **MSW** for API mocking.

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## Test Structure

```
src/
├── components/
│   └── ui/
│       ├── button.tsx
│       └── button.test.tsx        # Component tests
├── features/
│   └── posts/
│       ├── hooks/
│       │   ├── usePostData.ts
│       │   └── usePostData.test.ts  # Hook tests
│       └── components/
│           ├── PostList.tsx
│           └── PostList.test.tsx
tests/
├── setup.ts                       # Test setup
├── utils/
│   └── test-utils.tsx            # Test utilities
└── mocks/
    └── handlers.ts               # MSW handlers
```

## Writing Component Tests

### Basic Component Test

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from './button';

describe('Button', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('applies correct variant styles', () => {
    render(<Button variant="destructive">Delete</Button>);
    const button = screen.getByText('Delete');
    expect(button.className).toContain('destructive');
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByText('Click me')).toBeDisabled();
  });
});
```

### Testing User Interactions

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';

describe('LoginForm', () => {
  it('calls onSubmit with form data', async () => {
    const handleSubmit = vi.fn();
    const user = userEvent.setup();

    render(<LoginForm onSubmit={handleSubmit} />);

    // Type in inputs
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');

    // Click submit button
    await user.click(screen.getByRole('button', { name: /login/i }));

    // Assert
    expect(handleSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });

  it('shows validation errors', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    // Submit without filling form
    await user.click(screen.getByRole('button', { name: /login/i }));

    // Check for error messages
    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
  });
});
```

## Testing with Providers

### Using Test Utilities

```typescript
import { renderWithProviders, screen, waitFor } from '@/tests/utils/test-utils';
import { PostList } from './PostList';

describe('PostList', () => {
  it('renders posts from API', async () => {
    renderWithProviders(<PostList />);

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.getByText('Post 1')).toBeInTheDocument();
      expect(screen.getByText('Post 2')).toBeInTheDocument();
    });
  });

  it('shows loading state', () => {
    renderWithProviders(<PostList />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
```

### With Custom Store State

```typescript
import { renderWithProviders } from '@/tests/utils/test-utils';

it('shows user name when authenticated', () => {
  renderWithProviders(<Header />, {
    preloadedState: {
      auth: {
        user: { id: '1', name: 'John Doe', email: 'john@example.com' },
        isAuthenticated: true,
        token: 'fake-token',
      },
    },
  });

  expect(screen.getByText('John Doe')).toBeInTheDocument();
});
```

## Testing Hooks

### Testing Custom Hooks

```typescript
import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { AllTheProviders } from '@/tests/utils/test-utils';
import { usePosts } from './usePostData';

describe('usePosts', () => {
  it('fetches posts successfully', async () => {
    const { result } = renderHook(() => usePosts(), {
      wrapper: AllTheProviders,
    });

    // Initially loading
    expect(result.current.isLoading).toBe(true);

    // Wait for data
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Check data
    expect(result.current.data).toHaveLength(2);
    expect(result.current.data[0].title).toBe('Post 1');
  });

  it('handles errors', async () => {
    // Override MSW handler to return error
    server.use(
      http.get('/api/posts', () => {
        return new HttpResponse(null, { status: 500 });
      })
    );

    const { result } = renderHook(() => usePosts(), {
      wrapper: AllTheProviders,
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});
```

### Testing Redux Hooks

```typescript
import { renderHook, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createTestStore } from '@/tests/utils/test-utils';
import { useAuth } from './useAuth';

describe('useAuth', () => {
  it('logs in user', async () => {
    const store = createTestStore();
    const wrapper = ({ children }) => (
      <Provider store={store}>{children}</Provider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Initially not authenticated
    expect(result.current.isAuthenticated).toBe(false);

    // Login
    await act(async () => {
      await result.current.login({
        email: 'test@example.com',
        password: 'password',
      });
    });

    // Now authenticated
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toBeDefined();
  });
});
```

## Mocking APIs with MSW

### Setup

MSW is configured in `tests/mocks/handlers.ts`:

```typescript
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/posts', () => {
    return HttpResponse.json([
      { id: '1', title: 'Post 1', content: 'Content 1' },
      { id: '2', title: 'Post 2', content: 'Content 2' },
    ]);
  }),

  http.get('/api/posts/:id', ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      title: `Post ${params.id}`,
      content: 'Content here',
    });
  }),

  http.post('/api/posts', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      id: '3',
      ...body,
      createdAt: new Date().toISOString(),
    });
  }),
];
```

### Override Handlers in Tests

```typescript
import { server } from '@/tests/mocks/server';
import { http, HttpResponse } from 'msw';

it('handles 404 error', async () => {
  // Override handler for this test
  server.use(
    http.get('/api/posts/:id', () => {
      return new HttpResponse(null, { status: 404 });
    })
  );

  renderWithProviders(<PostDetail id="999" />);

  await waitFor(() => {
    expect(screen.getByText(/not found/i)).toBeInTheDocument();
  });
});

it('handles server error', async () => {
  server.use(
    http.get('/api/posts', () => {
      return new HttpResponse(null, { status: 500 });
    })
  );

  renderWithProviders(<PostList />);

  await waitFor(() => {
    expect(screen.getByText(/error/i)).toBeInTheDocument();
  });
});
```

## Testing Async Behavior

### Waiting for Elements

```typescript
import { screen, waitFor } from '@testing-library/react';

// Wait for element to appear
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
});

// Or use findBy (combines getBy + waitFor)
expect(await screen.findByText('Loaded')).toBeInTheDocument();

// Wait for element to disappear
await waitFor(() => {
  expect(screen.queryByText('Loading')).not.toBeInTheDocument();
});
```

### Testing Loading States

```typescript
it('shows loading state then data', async () => {
  renderWithProviders(<PostList />);

  // Initially loading
  expect(screen.getByRole('status')).toBeInTheDocument();

  // Then shows data
  await waitFor(() => {
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByText('Post 1')).toBeInTheDocument();
  });
});
```

## Testing Forms

### With React Hook Form

```typescript
import { useForm } from 'react-hook-form';
import { renderHook, act } from '@testing-library/react';

it('validates form fields', async () => {
  const { result } = renderHook(() =>
    useForm({
      defaultValues: { email: '', password: '' },
    })
  );

  // Trigger validation
  await act(async () => {
    await result.current.trigger();
  });

  // Check for errors
  expect(result.current.formState.errors.email).toBeDefined();
  expect(result.current.formState.errors.password).toBeDefined();
});
```

### Integration Test

```typescript
it('submits form with valid data', async () => {
  const handleSubmit = vi.fn();
  const user = userEvent.setup();

  renderWithProviders(<ContactForm onSubmit={handleSubmit} />);

  // Fill form
  await user.type(screen.getByLabelText(/name/i), 'John Doe');
  await user.type(screen.getByLabelText(/email/i), 'john@example.com');
  await user.type(screen.getByLabelText(/message/i), 'Hello world');

  // Submit
  await user.click(screen.getByRole('button', { name: /submit/i }));

  // Verify submission
  await waitFor(() => {
    expect(handleSubmit).toHaveBeenCalledWith({
      name: 'John Doe',
      email: 'john@example.com',
      message: 'Hello world',
    });
  });
});
```

## Snapshot Testing

```typescript
import { render } from '@testing-library/react';

it('matches snapshot', () => {
  const { container } = render(<Card title="Test" content="Content" />);
  expect(container).toMatchSnapshot();
});
```

## Test Coverage

```bash
# Generate coverage report
npm run test:coverage
```

Coverage reports are generated in `coverage/` directory.

### Coverage Thresholds

Configure in `vitest.config.ts`:

```typescript
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80,
    },
  },
});
```

## Best Practices

### 1. Query Priority

```typescript
// 1. Accessible queries (preferred)
screen.getByRole('button', { name: /submit/i });
screen.getByLabelText(/email/i);
screen.getByPlaceholderText(/enter email/i);
screen.getByText(/welcome/i);

// 2. Semantic queries
screen.getByAltText(/profile picture/i);
screen.getByTitle(/close/i);

// 3. Test IDs (last resort)
screen.getByTestId('submit-button');
```

### 2. Async Utilities

```typescript
// ❌ Don't
await new Promise((resolve) => setTimeout(resolve, 1000));

// ✅ Do
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
});

// ✅ Or use findBy
expect(await screen.findByText('Loaded')).toBeInTheDocument();
```

### 3. User-Centric Tests

```typescript
// ❌ Don't test implementation details
expect(component.state.count).toBe(1);

// ✅ Do test user-visible behavior
expect(screen.getByText('Count: 1')).toBeInTheDocument();
```

### 4. Cleanup

Tests automatically cleanup between runs, but you can manually cleanup:

```typescript
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});
```

## Common Testing Patterns

### Testing Error Boundaries

```typescript
it('catches errors with error boundary', () => {
  const ThrowError = () => {
    throw new Error('Test error');
  };

  render(
    <ErrorBoundary>
      <ThrowError />
    </ErrorBoundary>
  );

  expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
});
```

### Testing Protected Routes

```typescript
it('redirects to login when not authenticated', () => {
  renderWithProviders(
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>,
    {
      preloadedState: {
        auth: { isAuthenticated: false },
      },
    }
  );

  // Should redirect (check router state or location)
  expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
});
```

### Testing Modals/Dialogs

```typescript
it('opens and closes modal', async () => {
  const user = userEvent.setup();
  renderWithProviders(<App />);

  // Modal not visible initially
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

  // Click button to open
  await user.click(screen.getByText(/open modal/i));

  // Modal now visible
  expect(screen.getByRole('dialog')).toBeInTheDocument();

  // Close modal
  await user.click(screen.getByRole('button', { name: /close/i }));

  // Modal closed
  await waitFor(() => {
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
```

## Debugging Tests

### Screen Debug

```typescript
import { screen, render } from '@testing-library/react';

it('debugs component', () => {
  render(<MyComponent />);
  
  // Print entire DOM
  screen.debug();
  
  // Print specific element
  screen.debug(screen.getByRole('button'));
});
```

### Logging

```typescript
it('logs queries', () => {
  const { container } = render(<MyComponent />);
  
  console.log(container.innerHTML);
  console.log(screen.logTestingPlaygroundURL());
});
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [MSW Documentation](https://mswjs.io/)
- [Common Mistakes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

