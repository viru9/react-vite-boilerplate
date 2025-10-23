import { api } from '@/services/api';
import type {
  ExampleItem,
  CreateExampleItemRequest,
  UpdateExampleItemRequest,
} from '../types';

/**
 * Example Feature Service
 * All API calls related to the example feature
 * These are used with React Query hooks
 */

export const exampleService = {
  /**
   * Fetch all items
   */
  getItems: async (): Promise<ExampleItem[]> => {
    const response = await api.get<ExampleItem[]>('/example/items');
    return response.data;
  },

  /**
   * Fetch a single item by ID
   */
  getItemById: async (id: string): Promise<ExampleItem> => {
    const response = await api.get<ExampleItem>(`/example/items/${id}`);
    return response.data;
  },

  /**
   * Create a new item
   */
  createItem: async (data: CreateExampleItemRequest): Promise<ExampleItem> => {
    const response = await api.post<ExampleItem>('/example/items', data);
    return response.data;
  },

  /**
   * Update an existing item
   */
  updateItem: async (data: UpdateExampleItemRequest): Promise<ExampleItem> => {
    const { id, ...updateData } = data;
    const response = await api.patch<ExampleItem>(
      `/example/items/${id}`,
      updateData
    );
    return response.data;
  },

  /**
   * Delete an item
   */
  deleteItem: async (id: string): Promise<void> => {
    await api.delete(`/example/items/${id}`);
  },
};

