import { Map } from 'immutable';
import { apiClient } from './apiClient';

/**
 * Command interface for all backend commands
 */
export interface Command {
  type: string;
  email?: string;
  timestamp?: number;
  [key: string]: any;
}

/**
 * Create a command with the specified type and payload
 * Pure function that builds a command object
 */
export const createCommand = (
  type: string,
  email: string,
  payload: Record<string, any> = {}
): Command => ({
  type,
  email,
  timestamp: Date.now(),
  ...payload
});

/**
 * Response interface for command results
 */
export interface CommandResponse<T> {
  type: 'success' | 'error';
  value?: T;
  error?: {
    message: string;
    code?: string;
  };
}

/**
 * Dispatch a command to the backend
 * Uses the apiClient to send a POST request to the /commands endpoint
 */
export const dispatchCommand = async <T>(
  command: Command
): Promise<CommandResponse<T>> => {
  try {
    const response = await apiClient.post('/api/commands', command);
    
    return {
      type: 'success',
      value: response.toJS() as T
    };
  } catch (error) {
    console.error('Command dispatch error:', error);
    return {
      type: 'error',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: 'COMMAND_ERROR'
      }
    };
  }
};

/**
 * Specific login command creator
 * Creates a LOGIN_ATTEMPT command with email and password
 */
export const createLoginCommand = (
  email: string, 
  password: string,
  role: string = 'user'
): Command => createCommand(
  'LOGIN_ATTEMPT',
  email,
  { password, role }
);

/**
 * Specific refresh token command creator
 * Creates a REFRESH_TOKEN command with email and refresh token
 */
export const createRefreshTokenCommand = (
  email: string,
  refreshToken: string
): Command => createCommand(
  'REFRESH_TOKEN',
  email,
  { refreshToken }
);
