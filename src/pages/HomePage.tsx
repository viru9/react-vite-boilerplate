import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/layouts/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/**
 * Home Page
 */
export function HomePage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold">
            Welcome to React Boilerplate
          </h1>
          <p className="text-muted-foreground mt-2">
            A modern, production-ready React boilerplate with best practices
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Redux Toolkit</CardTitle>
              <CardDescription>
                State management for client-side state
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Efficient state management with Redux Toolkit, including
                redux-persist for state persistence.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>React Query</CardTitle>
              <CardDescription>
                Server state management and caching
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Powerful data fetching and caching with React Query for optimal
                performance.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tailwind CSS</CardTitle>
              <CardDescription>Utility-first CSS framework</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Modern, responsive styling with Tailwind CSS and shadcn/ui
                components.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>TypeScript</CardTitle>
              <CardDescription>Type-safe development</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Full TypeScript support with strict mode for catching errors
                early.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Testing</CardTitle>
              <CardDescription>Vitest + React Testing Library</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Comprehensive testing setup with utilities and examples
                included.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Feature-Based Architecture</CardTitle>
              <CardDescription>Scalable code organization</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Modular, feature-based structure for easy maintenance and
                scaling.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
            <CardDescription>
              Check out the example feature to see patterns in action
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/example">
              <Button>View Example Feature</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

