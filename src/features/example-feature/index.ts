/**
 * Example Feature Public API
 * Export only what other parts of the app need to access
 */

// Components
export { ExampleList } from './components/ExampleList';

// Hooks
export {
  useExampleItems,
  useExampleItem,
  useCreateExampleItem,
  useUpdateExampleItem,
  useDeleteExampleItem,
} from './hooks/useExampleData';

// Types
export type {
  ExampleItem,
  ExampleState,
  CreateExampleItemRequest,
  UpdateExampleItemRequest,
} from './types';

// Redux Actions
export {
  setSelectedItem,
  clearSelectedItem,
  setError,
  clearError,
} from './slices/exampleSlice';

