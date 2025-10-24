# React Boilerplate

A modern, production-ready React boilerplate with TypeScript, Redux Toolkit, React Query, Tailwind CSS, and comprehensive testing setup.

## ✨ Features

### Core Stack
- ⚡️ **Vite** - Lightning fast build tool
- ⚛️ **React 18** - Latest React with concurrent features
- 🔷 **TypeScript** - Type safety throughout
- 🎨 **Tailwind CSS** - Utility-first styling
- 🎭 **shadcn/ui** - Beautiful, accessible components

### State Management
- 🔄 **Redux Toolkit** - Efficient client-side state management
- 🗄️ **Redux Persist** - State persistence
- 🚀 **React Query** - Server state and caching
- 🔌 **Axios** - HTTP client with interceptors and retry logic

### Developer Experience
- 📁 **Feature-based architecture** - Scalable code organization
- 🛣️ **React Router v6** - Declarative routing with lazy loading
- 🎯 **Path aliases** - Clean imports with `@/`
- 🔍 **ESLint + Prettier** - Code quality and formatting
- 🪝 **Husky + lint-staged** - Pre-commit hooks
- 📝 **Comprehensive documentation** - Guides for everything

### Testing
- 🧪 **Vitest** - Fast unit testing
- 🧩 **React Testing Library** - Component testing
- 🎭 **MSW** - API mocking
- 📊 **Coverage reporting** - Track test coverage

### Production Ready
- 🐳 **Docker** - Container support with nginx
- 🔒 **Authentication** - Complete auth flow with token refresh
- 🚨 **Error boundaries** - Graceful error handling
- ♿ **Accessibility** - ARIA attributes and semantic HTML
- 🌙 **Dark mode** - Built-in dark mode support

## 📦 What's Included

```
react-boilerplate/
├── src/
│   ├── app/                 # App configuration
│   │   ├── store.ts        # Redux store
│   │   ├── providers.tsx   # All providers
│   │   └── App.tsx         # Root component
│   ├── features/           # Feature modules
│   │   ├── auth/          # Authentication feature
│   │   └── example-feature/  # Template feature
│   ├── components/        # Shared components
│   │   ├── ui/           # UI components (shadcn/ui)
│   │   └── layouts/      # Layout components
│   ├── hooks/            # Custom hooks
│   ├── services/         # API configuration
│   ├── lib/             # Utilities
│   ├── types/           # TypeScript types
│   └── pages/           # Page components
├── tests/               # Test utilities
│   ├── setup.ts
│   ├── utils/
│   └── mocks/
├── docs/                # Documentation
│   ├── ARCHITECTURE.md
│   ├── FEATURE_CREATION.md
│   ├── COMPONENT_CREATION.md
│   ├── STATE_MANAGEMENT.md
│   ├── API_GUIDELINES.md
│   └── TESTING.md
└── Docker files & configs
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Git

### Installation

1. **Clone or use as template**

```bash
# Clone the repository
git clone https://github.com/yourusername/react-boilerplate.git my-app
cd my-app

# Or click "Use this template" on GitHub
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

```bash
# Copy the example env file
cp .env.example .env

# Edit .env with your configuration
```

Example `.env`:
```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_API_TIMEOUT=10000
VITE_TOKEN_KEY=auth_token
VITE_REFRESH_TOKEN_KEY=refresh_token
VITE_APP_NAME=My App
```

4. **Start development server**

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## 📜 Available Scripts

```bash
# Development
npm run dev              # Start dev server
npm run build           # Build for production
npm run preview         # Preview production build

# Code Quality
npm run lint            # Run ESLint
npm run lint:fix        # Fix ESLint errors
npm run format          # Format with Prettier
npm run type-check      # TypeScript type checking

# Testing
npm test                # Run tests
npm run test:ui         # Run tests with UI
npm run test:coverage   # Generate coverage report

# Git Hooks
npm run prepare         # Install Husky hooks
```

## 🏗️ Project Structure

### Feature-Based Organization

Each feature is self-contained:

```
features/your-feature/
├── components/      # Feature components
├── hooks/          # React Query hooks
├── services/       # API calls
├── slices/         # Redux slices (optional)
├── types/          # TypeScript types
└── index.ts        # Public API
```

### Benefits
- ✅ Easy to locate code
- ✅ Simple to add/remove features
- ✅ Natural code splitting
- ✅ Better team collaboration

## 🎯 Creating a New Feature

1. **Copy the example feature**

```bash
cp -r src/features/example-feature src/features/your-feature
```

2. **Update the code**

- Define types in `types/index.ts`
- Create API service in `services/`
- Add React Query hooks in `hooks/`
- Build components in `components/`
- Add Redux slice if needed in `slices/`
- Export public API in `index.ts`

3. **Add to store** (if using Redux)

```typescript
// src/app/store.ts
import yourReducer from '@/features/your-feature/slices/yourSlice';

const rootReducer = combineReducers({
  // ... other reducers
  yourFeature: yourReducer,
});
```

4. **Create page and route**

```typescript
// src/pages/YourFeaturePage.tsx
export function YourFeaturePage() {
  return (
    <MainLayout>
      <YourFeatureComponent />
    </MainLayout>
  );
}

// Add route in App.tsx
<Route path="/your-feature" element={<YourFeaturePage />} />
```

See [FEATURE_CREATION.md](docs/FEATURE_CREATION.md) for detailed guide.

## 🎨 Creating Components

### UI Components

Follow the shadcn/ui pattern:

```typescript
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'base-classes',
  {
    variants: {
      variant: {
        default: 'default-classes',
        destructive: 'destructive-classes',
      },
      size: {
        default: 'default-size',
        sm: 'small-size',
      },
    },
  }
);

export function Button({ variant, size, className, ...props }) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
```

See [COMPONENT_CREATION.md](docs/COMPONENT_CREATION.md) for detailed guide.

## 🔄 State Management

### Redux Toolkit (Client State)

Use for UI state, preferences, auth:

```typescript
const slice = createSlice({
  name: 'ui',
  initialState: { sidebarOpen: true },
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
  },
});

// In component
const { sidebarOpen } = useAppSelector((state) => state.ui);
const dispatch = useAppDispatch();
dispatch(toggleSidebar());
```

### React Query (Server State)

Use for API data, caching:

```typescript
// Hook
export function usePosts() {
  return useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      const response = await api.get('/posts');
      return response.data;
    },
  });
}

// Component
const { data, isLoading, error } = usePosts();
```

See [STATE_MANAGEMENT.md](docs/STATE_MANAGEMENT.md) for detailed guide.

## 🌐 API Calls

### Create a Service

```typescript
// features/posts/services/postService.ts
import { api } from '@/services/api';

export const postService = {
  getPosts: async () => {
    const response = await api.get('/posts');
    return response.data;
  },
  
  createPost: async (data) => {
    const response = await api.post('/posts', data);
    return response.data;
  },
};
```

### Use with React Query

```typescript
export function useCreatePost() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: postService.createPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}
```

See [API_GUIDELINES.md](docs/API_GUIDELINES.md) for detailed guide.

## 🧪 Testing

### Component Test

```typescript
import { renderWithProviders, screen } from '@/tests/utils/test-utils';

it('renders component', () => {
  renderWithProviders(<MyComponent />);
  expect(screen.getByText('Hello')).toBeInTheDocument();
});
```

### User Interaction

```typescript
import userEvent from '@testing-library/user-event';

it('handles click', async () => {
  const user = userEvent.setup();
  const handleClick = vi.fn();
  
  renderWithProviders(<Button onClick={handleClick}>Click</Button>);
  await user.click(screen.getByText('Click'));
  
  expect(handleClick).toHaveBeenCalled();
});
```

See [TESTING.md](docs/TESTING.md) for detailed guide.

## 🐳 Docker Deployment

### Build and Run

```bash
# Build image
docker build -t my-app .

# Run container
docker run -p 80:80 my-app
```

### Docker Compose

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - '80:80'
    environment:
      - NODE_ENV=production
```

## 📚 Documentation

Comprehensive guides are available in the `/docs` directory:

- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - Project structure and design decisions
- **[FEATURE_CREATION.md](docs/FEATURE_CREATION.md)** - Step-by-step feature creation
- **[COMPONENT_CREATION.md](docs/COMPONENT_CREATION.md)** - Component patterns and best practices
- **[STATE_MANAGEMENT.md](docs/STATE_MANAGEMENT.md)** - Redux and React Query usage
- **[API_GUIDELINES.md](docs/API_GUIDELINES.md)** - API integration and error handling
- **[TESTING.md](docs/TESTING.md)** - Testing strategies and examples

## 🤝 Contributing

This is a boilerplate template. Fork it and make it your own!

### Customization Checklist

- [ ] Update `package.json` with your app name and details
- [ ] Update `README.md` with your project information
- [ ] Update `index.html` title and meta tags
- [ ] Configure `.env` with your API endpoints
- [ ] Remove/modify example feature
- [ ] Update favicons in `/public`
- [ ] Configure CI/CD for your platform
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Configure analytics

## 📝 License

MIT License - feel free to use this boilerplate for any project!

## 🙏 Acknowledgments

Built with these amazing tools:

- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Redux Toolkit](https://redux-toolkit.js.org/)
- [TanStack Query](https://tanstack.com/query)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Vitest](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/)

## 💡 Tips

### Performance
- Features are lazy-loaded by default
- React Query caches API responses
- Redux Persist speeds up initial load
- Tailwind purges unused CSS

### Security
- Tokens stored securely
- Automatic token refresh
- Protected routes
- CSRF protection ready

### Scalability
- Feature-based architecture
- Code splitting
- Type safety
- Modular design

---

**Happy coding! 🚀**

For questions or issues, please check the documentation in `/docs` or open an issue on GitHub.

