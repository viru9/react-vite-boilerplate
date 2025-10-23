import { useExampleItems, useDeleteExampleItem } from '../hooks/useExampleData';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import { setSelectedItem } from '../slices/exampleSlice';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import type { ExampleItem } from '../types';

/**
 * Example List Component
 * Demonstrates:
 * - React Query for server state (fetching items)
 * - Redux for client state (selected item)
 * - Mutations with optimistic updates
 */
export function ExampleList() {
  const dispatch = useAppDispatch();
  const selectedItem = useAppSelector((state) => state.example.selectedItem);

  // React Query for server state
  const { data: items, isLoading, error } = useExampleItems();
  const deleteMutation = useDeleteExampleItem();

  const handleSelect = (item: ExampleItem) => {
    // Store selected item in Redux (client state)
    dispatch(setSelectedItem(item));
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-destructive">
            Error loading items: {error.message}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!items || items.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">No items found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Example Items</CardTitle>
          <CardDescription>
            List of items fetched from the API using React Query
          </CardDescription>
        </CardHeader>
      </Card>

      {selectedItem && (
        <Card className="border-primary">
          <CardContent className="pt-6">
            <p className="text-sm">
              <strong>Selected:</strong> {selectedItem.title}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <Card
            key={item.id}
            className={
              selectedItem?.id === item.id ? 'ring-2 ring-primary' : ''
            }
          >
            <CardHeader>
              <CardTitle className="text-lg">{item.title}</CardTitle>
              <CardDescription>{item.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs rounded-full px-2 py-1 ${
                    item.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {item.status}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(item.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSelect(item)}
                >
                  Select
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(item.id)}
                  disabled={deleteMutation.isPending}
                >
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

