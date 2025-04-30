import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Map as ImmutableMap, fromJS } from 'immutable';
import { dispatchCommand, createLoginCommand, createRefreshTokenCommand, createRegisterCommand } from '../../core/api/commandDispatcher';

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

// Register response from the backend
interface RegisterResponse {
  success: boolean;
  email: string;
  message?: string;
  error?: string;
  zoho_contact_id?: string;
  zoho_account_id?: string;
}

// Social login response
interface SocialLoginResponse {
  success: boolean;
  provider: string;
  redirectUrl?: string;
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

// Async thunk for social login attempt
export const socialLoginAttempt = createAsyncThunk<
  SocialLoginResponse,
  { provider: string },
  { rejectValue: string }
>(
  'auth/socialLoginAttempt',
  async ({ provider }, { rejectWithValue }) => {
    try {
      // Esta función principalmente marca el estado como isLoading
      // La autenticación real ocurre a través del cliente de Supabase directamente
      return {
        success: true,
        provider
      };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : `Social authentication with ${provider} failed`
      );
    }
  }
);

// Async thunk for registration - validated with Zoho CRM
export const registerAttempt = createAsyncThunk<
  RegisterResponse,
  { email: string; password: string },
  { rejectValue: { message: string } }
>(
  'auth/registerAttempt',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      // Create the register command
      const registerCommand = createRegisterCommand(email, password);
      
      // Dispatch the command to the backend (which will validate against Zoho CRM)
      const result = await dispatchCommand<RegisterResponse>(registerCommand);
      
      // Handle the result
      if (result.type === 'success') {
        const response = result.value;
        
        // If registration failed on the backend side
        if (!response.success) {
          return rejectWithValue({ 
            message: response.error || 'Registration failed. Email not found in Zoho CRM.'
          });
        }
        
        return response;
      } else {
        return rejectWithValue({ 
          message: result.error.message || 'Registration failed. Please try again later.'
        });
      }
    } catch (error) {
      return rejectWithValue({
        message: error instanceof Error 
          ? error.message 
          : 'Registration failed. Please try again later.'
      });
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
      // Eliminamos todas las claves de autenticación del localStorage
      localStorage.removeItem('auth');
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('user');
      
      // Luego restablecemos el estado a su valor inicial
      return initialState;
    },
    clearError: (state) => {
      state.error = null;
    },
    // Acción para manejar el login manual/simulado
    loginSuccess: (state, action) => {
      const { email, accessToken, refreshToken } = action.payload;
      state.isLoading = false;
      state.isAuthenticated = true;
      state.email = email;
      state.tokens = {
        accessToken,
        refreshToken
      };
      state.error = null;
      
      // Actualizar localStorage
      localStorage.setItem('isLoggedIn', 'true');
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
        
        // Guardamos el estado de autenticación en localStorage
        localStorage.setItem('isLoggedIn', 'true');
      })
      .addCase(loginAttempt.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.error = action.payload || 'Login failed';
      })
      
      // Social login cases
      .addCase(socialLoginAttempt.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(socialLoginAttempt.fulfilled, (state) => {
        // No establecemos estado aquí, ya que la redirección manejará el resultado
        state.isLoading = true; // Mantenemos loading hasta la redirección
      })
      .addCase(socialLoginAttempt.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Social login failed';
      })
      
      // Registration attempt cases
      .addCase(registerAttempt.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerAttempt.fulfilled, (state) => {
        state.isLoading = false;
        // No establecemos como autenticado aquí, ya que el usuario debe iniciar sesión después de registrarse
      })
      .addCase(registerAttempt.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Registration failed';
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
export const { logout, clearError, loginSuccess } = authSlice.actions;
export default authSlice.reducer;
