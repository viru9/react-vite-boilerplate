# Architecture Overview

## Project Structure

This boilerplate follows a **feature-based architecture** that scales well with growing applications.

```
src/
├── app/                    # Application-level configuration
│   ├── store.ts           # Redux store setup
│   ├── providers.tsx      # All providers wrapper
│   └── App.tsx            # Root component with routing
├── features/              # Feature modules (domain-driven)
│   ├── auth/
│   │   ├── components/   # Feature-specific components
│   │   ├── hooks/        # Custom hooks for this feature
│   │   ├── services/     # API calls
│   │   ├── slices/       # Redux slices
│   │   ├── types/        # TypeScript interfaces
│   │   └── index.ts      # Public API exports
│   └── example-feature/
├── components/            # Shared/reusable components
│   ├── ui/               # UI components (shadcn/ui)
│   └── layouts/          # Layout components
├── hooks/                # Shared custom hooks
├── services/             # Shared services (API, query client)
├── lib/                  # Third-party library configurations
├── types/                # Shared TypeScript types
├── constants/            # Application constants
└── pages/                # Page components for routing
```

## Key Design Decisions

### 1. State Management Strategy

We use a **hybrid approach** that leverages the strengths of both Redux and React Query:

- **Redux Toolkit**: Client-side state that doesn't sync with server
  - User preferences
  - UI state (modals, sidebars, selected items)
  - Application-wide state
  - Authentication tokens

- **React Query (TanStack Query)**: Server state
  - Data fetching from APIs
  - Caching and synchronization
  - Background updates
  - Optimistic updates

This separation of concerns leads to:
- Less Redux boilerplate
- Better caching strategies
- Clearer mental model
- Improved performance

### 2. Feature-Based Organization

Each feature is self-contained with:
- Its own components
- Redux slice (if needed)
- API services
- Custom hooks
- Types

**Benefits:**
- Easy to locate feature-specific code
- Simple to delete/add features
- Natural code splitting boundaries
- Better team collaboration (less merge conflicts)

### 3. TypeScript Configuration

- **Strict mode enabled**: Catch errors early
- **Path aliases**: `@/` maps to `src/` for cleaner imports
- **No implicit any**: Explicit typing required

### 4. Code Splitting

- Lazy loading for route components
- Feature-based chunks
- Smaller initial bundle size
- Faster page loads

## Technology Stack

### Core
- **React 18**: UI library with concurrent features
- **TypeScript**: Type safety and better DX
- **Vite**: Fast build tool and dev server

### State Management
- **Redux Toolkit**: Client state with less boilerplate
- **Redux Persist**: State persistence
- **React Query**: Server state and caching

### Routing
- **React Router v6**: Declarative routing with lazy loading

### Styling
- **Tailwind CSS**: Utility-first CSS
- **shadcn/ui**: Headless component library
- **class-variance-authority**: Component variants

### Forms & Validation
- **React Hook Form**: Performant form handling
- **Zod**: Schema validation

### HTTP Client
- **Axios**: Promise-based HTTP client
- **Axios Retry**: Automatic retry logic

### Testing
- **Vitest**: Fast unit testing
- **React Testing Library**: Component testing
- **MSW**: API mocking

### Development Tools
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Husky**: Git hooks
- **lint-staged**: Run linters on staged files

## Data Flow

### Server State (React Query)
```
Component → useQuery → API Service → Backend
                ↓
            React Query Cache
                ↓
            Auto-revalidation
```

### Client State (Redux)
```
Component → useAppDispatch → Action → Reducer → Store
                                                   ↓
Component ← useAppSelector ← Store ← Redux Persist
```

### Authentication Flow
```
Login → Auth Service → Store Token → Redux + localStorage
                                           ↓
Protected Route → Check Auth → Allow/Redirect
                       ↓
API Calls → Interceptor adds Token
```

## Performance Optimizations

1. **Code Splitting**: Route-based lazy loading
2. **React Query Caching**: Reduces unnecessary API calls
3. **Redux Persist**: Faster initial loads
4. **Memoization**: React.memo for expensive components
5. **Bundle Optimization**: Vite's automatic chunking

## Security Considerations

1. **Token Management**: Secure storage and refresh logic
2. **API Interceptors**: Automatic token attachment
3. **Error Boundaries**: Graceful error handling
4. **Input Validation**: Zod schemas for runtime validation
5. **HTTPS Only**: Production configuration

## Scalability

This architecture supports:
- **Horizontal scaling**: Add more features without refactoring
- **Team scaling**: Multiple developers can work on different features
- **Performance scaling**: Code splitting and lazy loading
- **Complexity scaling**: Clear separation of concerns

## Migration Path

When you need to:
- **Add a feature**: Copy example-feature template
- **Remove a feature**: Delete feature folder and remove from store
- **Change state library**: Each feature is isolated
- **Update styling**: Tailwind utility classes are easy to replace

## Best Practices

1. **Colocate related code**: Keep components, hooks, and services together
2. **Use absolute imports**: Leverage `@/` path alias
3. **Export public APIs**: Use index.ts to control exports
4. **Type everything**: No implicit any
5. **Test important flows**: Focus on user interactions
6. **Document complex logic**: Comments for "why", not "what"

