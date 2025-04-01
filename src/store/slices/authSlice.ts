import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Map as ImmutableMap, fromJS } from 'immutable';
import { dispatchCommand, createLoginCommand, createRefreshTokenCommand } from '../../core/api/commandDispatcher';

// Define the authentication interfaces
interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// Login response from the backend
interface LoginResponse {
  success: boolean;
  email: string;
  accessToken: string;
  refreshToken: string;
  error?: string;
}

// Define the state interface with immutable structures
interface AuthState {
  email: string | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

// Initial state with immutable structures
const initialState: AuthState = {
  email: null,
  tokens: null,
  isLoading: false,
  isAuthenticated: false,
  error: null
};

// Async thunk for login attempt
export const loginAttempt = createAsyncThunk<
  LoginResponse,
  { email: string; password: string; role?: string },
  { rejectValue: string }
>(
  'auth/loginAttempt',
  async ({ email, password, role = 'user' }, { rejectWithValue }) => {
    try {
      // Create the login command
      const loginCommand = createLoginCommand(email, password, role);
      
      // Dispatch the command to the backend
      const result = await dispatchCommand<LoginResponse>(loginCommand);
      
      // Handle the result
      if (result.type === 'success') {
        const response = result.value;
        
        // If login failed on the backend side
        if (!response.success) {
          return rejectWithValue(response.error || 'Authentication failed');
        }
        
        return response;
      } else {
        return rejectWithValue(result.error.message || 'Authentication failed');
      }
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Authentication failed'
      );
    }
  }
);

// Async thunk for token refresh
export const refreshToken = createAsyncThunk<
  LoginResponse,
  void,
  { rejectValue: string; state: { auth: AuthState } }
>(
  'auth/refreshToken',
  async (_, { getState, rejectWithValue }) => {
    const { email, tokens } = getState().auth;
    
    if (!email || !tokens || !tokens.refreshToken) {
      return rejectWithValue('No refresh token available');
    }
    
    try {
      // Create the refresh token command
      const refreshCommand = createRefreshTokenCommand(email, tokens.refreshToken);
      
      // Dispatch the command to the backend
      const result = await dispatchCommand<LoginResponse>(refreshCommand);
      
      // Handle the result
      if (result.type === 'success') {
        const response = result.value;
        
        // If refresh failed on the backend side
        if (!response.success) {
          return rejectWithValue(response.error || 'Token refresh failed');
        }
        
        return response;
      } else {
        return rejectWithValue(result.error.message || 'Token refresh failed');
      }
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Token refresh failed'
      );
    }
  }
);

// Create the auth slice with pure reducers
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      // Primero eliminamos cualquier información de autenticación del localStorage
      localStorage.removeItem('auth');
      
      // Luego restablecemos el estado a su valor inicial
      return initialState;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Login attempt cases
      .addCase(loginAttempt.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginAttempt.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.email = action.payload.email;
        state.tokens = {
          accessToken: action.payload.accessToken,
          refreshToken: action.payload.refreshToken
        };
        state.error = null;
      })
      .addCase(loginAttempt.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.error = action.payload || 'Login failed';
      })
      
      // Token refresh cases
      .addCase(refreshToken.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.email = action.payload.email;
        state.tokens = {
          accessToken: action.payload.accessToken,
          refreshToken: action.payload.refreshToken
        };
        state.error = null;
      })
      .addCase(refreshToken.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.tokens = null;
        state.error = action.payload || 'Token refresh failed';
      });
  }
});

// Export actions and reducer
export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
