import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { exampleService } from '../services/exampleService';
import type {
  CreateExampleItemRequest,
  UpdateExampleItemRequest,
} from '../types';
import { getErrorMessage } from '@/services/api';

/**
 * Query keys for React Query
 */
export const exampleKeys = {
  all: ['example'] as const,
  lists: () => [...exampleKeys.all, 'list'] as const,
  list: (filters: string) => [...exampleKeys.lists(), { filters }] as const,
  details: () => [...exampleKeys.all, 'detail'] as const,
  detail: (id: string) => [...exampleKeys.details(), id] as const,
};

/**
 * Hook to fetch all items
 */
export function useExampleItems() {
  return useQuery({
    queryKey: exampleKeys.lists(),
    queryFn: exampleService.getItems,
  });
}

/**
 * Hook to fetch a single item
 */
export function useExampleItem(id: string) {
  return useQuery({
    queryKey: exampleKeys.detail(id),
    queryFn: () => exampleService.getItemById(id),
    enabled: !!id, // Only run query if id exists
  });
}

/**
 * Hook to create a new item
 */
export function useCreateExampleItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateExampleItemRequest) =>
      exampleService.createItem(data),
    onSuccess: () => {
      // Invalidate and refetch items list
      queryClient.invalidateQueries({ queryKey: exampleKeys.lists() });
    },
    onError: (error) => {
      console.error('Failed to create item:', getErrorMessage(error));
    },
  });
}

/**
 * Hook to update an existing item
 */
export function useUpdateExampleItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateExampleItemRequest) =>
      exampleService.updateItem(data),
    onSuccess: (data) => {
      // Invalidate both list and detail queries
      queryClient.invalidateQueries({ queryKey: exampleKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: exampleKeys.detail(data.id),
      });
    },
    onError: (error) => {
      console.error('Failed to update item:', getErrorMessage(error));
    },
  });
}

/**
 * Hook to delete an item
 */
export function useDeleteExampleItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => exampleService.deleteItem(id),
    onSuccess: () => {
      // Invalidate items list
      queryClient.invalidateQueries({ queryKey: exampleKeys.lists() });
    },
    onError: (error) => {
      console.error('Failed to delete item:', getErrorMessage(error));
    },
  });
}

