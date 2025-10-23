# Component Creation Guide

This guide covers creating reusable components following shadcn/ui patterns and best practices.

## Component Types

### 1. UI Components (`src/components/ui/`)

Basic, reusable UI elements like buttons, inputs, cards.

**Characteristics:**
- No business logic
- Highly reusable
- Styled with Tailwind CSS
- Support variants and sizes
- Fully typed props

### 2. Shared Components (`src/components/`)

Common components used across features like layouts, error boundaries.

### 3. Feature Components (`src/features/[feature]/components/`)

Feature-specific components that contain business logic.

## Creating a UI Component

### Example: Creating a Badge Component

```typescript
// src/components/ui/badge.tsx
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline: 'text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
```

### Key Principles

1. **Use `cn()` utility**: Merge Tailwind classes properly
2. **Define variants**: Use `class-variance-authority` for variations
3. **Type everything**: Extend HTML element props
4. **Forward refs**: For components that need ref access
5. **Export variants**: For testing and extension

## Component Patterns

### 1. Forwarding Refs

```typescript
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn('...', className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';
```

### 2. Compound Components

```typescript
// Card compound component pattern
export function Card({ children, className }: CardProps) {
  return <div className={cn('...', className)}>{children}</div>;
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return <div className={cn('...', className)}>{children}</div>;
}

export function CardContent({ children, className }: CardContentProps) {
  return <div className={cn('...', className)}>{children}</div>;
}

// Usage
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content here</CardContent>
</Card>
```

### 3. Controlled vs Uncontrolled

```typescript
// Controlled
function Input({ value, onChange }: ControlledInputProps) {
  return <input value={value} onChange={onChange} />;
}

// Uncontrolled with default
function Input({ defaultValue }: UncontrolledInputProps) {
  return <input defaultValue={defaultValue} />;
}

// Supporting both
function Input({ value, defaultValue, onChange }: InputProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const isControlled = value !== undefined;
  
  const currentValue = isControlled ? value : internalValue;
  
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!isControlled) {
      setInternalValue(e.target.value);
    }
    onChange?.(e);
  };
  
  return <input value={currentValue} onChange={handleChange} />;
}
```

### 4. Polymorphic Components

```typescript
type PolymorphicProps<E extends React.ElementType> = {
  as?: E;
  children: React.ReactNode;
} & React.ComponentPropsWithoutRef<E>;

function Text<E extends React.ElementType = 'span'>({
  as,
  children,
  ...props
}: PolymorphicProps<E>) {
  const Component = as || 'span';
  return <Component {...props}>{children}</Component>;
}

// Usage
<Text as="h1">Heading</Text>
<Text as="p">Paragraph</Text>
```

## Styling Guidelines

### 1. Tailwind Best Practices

```typescript
// ✅ Good: Use cn() for conditional classes
className={cn(
  'base classes here',
  isActive && 'active classes',
  className // Allow override
)}

// ✅ Good: Group related classes
className="flex items-center justify-between gap-4"

// ❌ Bad: String concatenation
className={`base ${isActive ? 'active' : ''} ${className}`}

// ❌ Bad: Inline objects
style={{ display: 'flex', alignItems: 'center' }}
```

### 2. Responsive Design

```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Mobile: 1 column, Tablet: 2 columns, Desktop: 3 columns */}
</div>

<div className="text-sm md:text-base lg:text-lg">
  {/* Responsive text sizes */}
</div>
```

### 3. Dark Mode Support

```typescript
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
  {/* Automatic dark mode support */}
</div>

// Using CSS variables (preferred)
<div className="bg-background text-foreground">
  {/* Uses theme variables from globals.css */}
</div>
```

## Accessibility

### 1. Semantic HTML

```typescript
// ✅ Good: Semantic elements
<button type="button" onClick={handleClick}>Click me</button>
<nav aria-label="Main navigation">...</nav>
<main>...</main>

// ❌ Bad: Div soup
<div onClick={handleClick}>Click me</div>
```

### 2. ARIA Attributes

```typescript
<button
  aria-label="Close dialog"
  aria-pressed={isPressed}
  aria-expanded={isExpanded}
>
  <X className="h-4 w-4" />
</button>

<div role="status" aria-live="polite">
  {statusMessage}
</div>
```

### 3. Keyboard Navigation

```typescript
function Dialog({ onClose }: DialogProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);
  
  return <div role="dialog" aria-modal="true">...</div>;
}
```

## Performance Optimization

### 1. React.memo

```typescript
export const ExpensiveComponent = React.memo(({ data }: Props) => {
  return <div>{/* Expensive rendering */}</div>;
});
```

### 2. useMemo / useCallback

```typescript
function Component({ items }: Props) {
  // Memoize expensive calculations
  const sortedItems = useMemo(
    () => items.sort((a, b) => a.name.localeCompare(b.name)),
    [items]
  );
  
  // Memoize callbacks to prevent re-renders
  const handleClick = useCallback(() => {
    console.log('clicked');
  }, []);
  
  return <List items={sortedItems} onClick={handleClick} />;
}
```

### 3. Code Splitting

```typescript
// Lazy load heavy components
const HeavyChart = lazy(() => import('./HeavyChart'));

function Dashboard() {
  return (
    <Suspense fallback={<Spinner />}>
      <HeavyChart />
    </Suspense>
  );
}
```

## Testing Components

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, userEvent } from '@testing-library/react';
import { Button } from './button';

describe('Button', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('handles click events', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    render(<Button onClick={handleClick}>Click me</Button>);
    await user.click(screen.getByText('Click me'));
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies variant styles', () => {
    render(<Button variant="destructive">Delete</Button>);
    expect(screen.getByText('Delete').className).toContain('destructive');
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByText('Click me')).toBeDisabled();
  });
});
```

## Component Checklist

- [ ] TypeScript interfaces defined
- [ ] Props extend HTML element props
- [ ] `className` prop supported for customization
- [ ] Forwarding ref (if needed)
- [ ] Variants defined with CVA
- [ ] Responsive design considered
- [ ] Dark mode support
- [ ] Accessibility attributes added
- [ ] Keyboard navigation supported
- [ ] Tests written
- [ ] Documented with JSDoc (if complex)

## Common Patterns Examples

### Loading State Component

```typescript
interface LoadingProps {
  isLoading: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function Loading({ isLoading, children, fallback }: LoadingProps) {
  if (isLoading) {
    return <>{fallback || <Spinner />}</>;
  }
  return <>{children}</>;
}
```

### Error Boundary Component

```typescript
export function ErrorFallback({ error, resetError }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Something went wrong</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{error.message}</p>
        <Button onClick={resetError}>Try again</Button>
      </CardContent>
    </Card>
  );
}
```

### Empty State Component

```typescript
export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action 
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      {Icon && <Icon className="h-12 w-12 text-muted-foreground" />}
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
```

## Resources

- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Tailwind CSS Documentation](https://tailwindcss.com)
- [Radix UI Primitives](https://www.radix-ui.com)
- [React Aria](https://react-spectrum.adobe.com/react-aria/)

