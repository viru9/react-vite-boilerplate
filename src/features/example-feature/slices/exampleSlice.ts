import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ExampleState, ExampleItem } from '../types';

/**
 * Example Feature Slice
 * Used for client-side state that doesn't need server synchronization
 * For server state, use React Query (see hooks/useExampleData.ts)
 */

const initialState: ExampleState = {
  items: [],
  selectedItem: null,
  isLoading: false,
  error: null,
};

const exampleSlice = createSlice({
  name: 'example',
  initialState,
  reducers: {
    setSelectedItem: (state, action: PayloadAction<ExampleItem | null>) => {
      state.selectedItem = action.payload;
    },
    clearSelectedItem: (state) => {
      state.selectedItem = null;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const { setSelectedItem, clearSelectedItem, setError, clearError } =
  exampleSlice.actions;
export default exampleSlice.reducer;

