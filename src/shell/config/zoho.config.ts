// Centralized configuration for Zoho API
import { Map } from 'immutable';
import { ZohoConfig } from '../../core/models/zoho.types';

// Type definition for immutable config
type ImmutableZohoConfig = Map<string, string>;

/**
 * Pure function to validate required environment variables
 * @returns A tuple with [isValid, missingVars]
 */
const validateEnvVars = (): [boolean, string[]] => {
  const requiredVars = [
    'VITE_ZOHO_ORGANIZATION_ID',
    'VITE_ZOHO_API_TOKEN',
    'VITE_ZOHO_BASE_URL',
  ];
  
  const missingVars = requiredVars.filter(varName => !import.meta.env[varName]);
  return [missingVars.length === 0, missingVars];
};

/**
 * Pure function to get Zoho configuration from environment variables
 * @returns Zoho configuration object
 * @throws Error if required environment variables are missing
 */
export const getZohoConfig = (): ZohoConfig => {
  const [isValid, missingVars] = validateEnvVars();
  
  if (!isValid) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}`
    );
  }
  
  // Create immutable config map
  const immutableConfig = Map({
    organizationId: import.meta.env.VITE_ZOHO_ORGANIZATION_ID || '',
    apiToken: import.meta.env.VITE_ZOHO_API_TOKEN || '',
    baseUrl: import.meta.env.VITE_ZOHO_BASE_URL || '',
  });
  
  // Convert to regular object for compatibility with existing code
  return {
    organizationId: immutableConfig.get('organizationId', ''),
    apiToken: immutableConfig.get('apiToken', ''),
    baseUrl: immutableConfig.get('baseUrl', ''),
  };
};

/**
 * Pure function to get Zoho configuration as an immutable map
 * @returns Immutable Zoho configuration map
 * @throws Error if required environment variables are missing
 */
export const getImmutableZohoConfig = (): ImmutableZohoConfig => {
  const [isValid, missingVars] = validateEnvVars();
  
  if (!isValid) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}`
    );
  }
  
  return Map({
    organizationId: import.meta.env.VITE_ZOHO_ORGANIZATION_ID || '',
    apiToken: import.meta.env.VITE_ZOHO_API_TOKEN || '',
    baseUrl: import.meta.env.VITE_ZOHO_BASE_URL || '',
  });
};
