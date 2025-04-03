import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { List as ImmutableList, Map as ImmutableMap } from 'immutable';
import type { List as ImmutableListType } from 'immutable';
import { ZohoCategory, ImmutableCategory } from '../../core/models/zoho.types';
import { RootState } from '../rootReducer';

// Define the state interface
interface CategoriesState {
  items: ImmutableListType<ImmutableCategory>;
  loading: boolean;
  error: string | null;
}

// Initial state with immutable structures
const initialState: CategoriesState = {
  items: ImmutableList(),
  loading: false,
  error: null
};

// Async thunk that accepts a function parameter for fetching categories
export const fetchCategories = createAsyncThunk<
  ZohoCategory[], 
  () => Promise<ZohoCategory[]>,
  { rejectValue: string }
>(
  'categories/fetchCategories',
  async (fetchCategories, { rejectWithValue }) => {
    try {
      const categories = await fetchCategories();
      return categories;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch categories');
    }
  }
);

// Create the categories slice
const categoriesSlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {
    resetCategories: () => initialState
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        const newItems = ImmutableList<ImmutableCategory>(
          action.payload.map(item => ImmutableMap<string, any>(item))
        );
        Object.assign(state, {
          items: newItems,
          loading: false,
          error: null
        });
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch categories';
      });
  }
});

// Export actions and reducer
export const { resetCategories } = categoriesSlice.actions;
export default categoriesSlice.reducer;

// Selectores
export const selectCategories = (state: RootState) => state.categories.items;
export const selectCategoriesLoading = (state: RootState) => state.categories.loading;
export const selectCategoriesError = (state: RootState) => state.categories.error;
