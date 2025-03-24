import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Map as ImmutableMap } from 'immutable';
import { ZohoUser, ImmutableUser } from '../../core/models/zoho.types';

// Define the auth response interface
interface AuthResponse {
  user: ZohoUser;
  token: string;
}

// Define the state interface
interface AuthState {
  user: ImmutableUser | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

// Initial state with immutable structures
const initialState: AuthState = {
  user: null,
  token: null,
  loading: false,
  error: null,
  isAuthenticated: false
};

// Async thunk that accepts a function parameter for user authentication
export const authenticateUser = createAsyncThunk<
  { user: ImmutableUser; token: string },
  { 
    authenticateUser: (email: string, password: string) => Promise<AuthResponse>; 
    email: string; 
    password: string 
  },
  { rejectValue: string }
>(
  'auth/authenticateUser',
  async ({ authenticateUser, email, password }, { rejectWithValue }) => {
    try {
      const response = await authenticateUser(email, password);
      return {
        user: ImmutableMap(response.user) as ImmutableUser,
        token: response.token
      };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Authentication failed');
    }
  }
);

// Create the auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: () => initialState,
    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
      state.isAuthenticated = !!action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(authenticateUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(authenticateUser.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.loading = false;
        state.error = null;
      })
      .addCase(authenticateUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Authentication failed';
      });
  }
});

// Export actions and reducer
export const { logout, setToken } = authSlice.actions;
export default authSlice.reducer;
