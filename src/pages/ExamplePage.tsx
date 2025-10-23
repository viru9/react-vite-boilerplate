import { MainLayout } from '@/components/layouts/MainLayout';
import { ExampleList } from '@/features/example-feature';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

/**
 * Example Feature Page
 * Demonstrates the complete pattern: Redux + React Query + Components
 */
export function ExamplePage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Example Feature</CardTitle>
            <CardDescription>
              This page demonstrates the complete architecture pattern:
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
                <li>React Query for server state (API data fetching)</li>
                <li>Redux for client state (selected item)</li>
                <li>Feature-based folder structure</li>
                <li>TypeScript interfaces and types</li>
                <li>Reusable shadcn/ui components</li>
              </ul>
            </CardDescription>
          </CardHeader>
        </Card>

        <ExampleList />
      </div>
    </MainLayout>
  );
}

