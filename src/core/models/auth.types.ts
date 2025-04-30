// Tipos para autenticación
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  success: boolean;
  email: string;
  accessToken: string;
  refreshToken: string;
  error?: string;
}

export interface RegisterResponse {
  success: boolean;
  email: string;
  message?: string;
  error?: string;
  zoho_contact_id?: string;
  zoho_account_id?: string;
}

export interface SocialLoginResponse {
  success: boolean;
  provider: 'google'; // Solo permitimos Google
  redirectUrl?: string;
}

export interface AuthState {
  email: string | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}
