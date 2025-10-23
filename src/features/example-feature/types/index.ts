/**
 * Example Feature Types
 * Define all TypeScript interfaces and types for this feature
 */

export interface ExampleItem {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface ExampleState {
  items: ExampleItem[];
  selectedItem: ExampleItem | null;
  isLoading: boolean;
  error: string | null;
}

export interface CreateExampleItemRequest {
  title: string;
  description: string;
}

export interface UpdateExampleItemRequest {
  id: string;
  title?: string;
  description?: string;
  status?: 'active' | 'inactive';
}

