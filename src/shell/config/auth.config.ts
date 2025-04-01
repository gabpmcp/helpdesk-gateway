import { createZohoClient, fetchZohoUser } from '../externalClients/zohoClient';
import { registerClient } from '../database/clients';
import { db } from '../database/dbInstance';
import { getZohoConfig } from './zoho.config';
import { Map } from 'immutable';
import { verifyAndRegisterUser } from '../../core/auth/verifyAndRegisterUser';
import { authTransition } from '../../core/logic/zohoLogic';
import { apiClient } from '../../core/api/apiClient';

// Create the Zoho client with configuration
const zohoClient = createZohoClient();

// Get the API request function from zohoClient
const apiRequest = (endpoint: string) => (options: any = {}) => 
  zohoClient.authenticateUser(endpoint)(options);

// Configure the fetchZohoUser function with the API request function
export const configuredFetchZohoUser = fetchZohoUser(apiRequest);

// Configure the registerClient function with the database
export const configuredRegisterClient = registerClient(db);

// Configure the complete authentication flow
export const configuredVerifyAndRegisterUser = verifyAndRegisterUser(
  configuredFetchZohoUser,
  configuredRegisterClient
);

// Configure the event-sourced authentication flow using backend API
export const configuredAuthTransition = authTransition(
  configuredFetchZohoUser,
  // Replace direct Supabase call with backend API call
  async (userId: string, command: any, event: any): Promise<any> => {
    return apiClient.post('/api/commands', {
      type: 'RECORD_AUTH_EVENT',
      userId,
      eventData: event,
      commandData: command,
      timestamp: Date.now()
    }).then(result => {
      if (result.type === 'failure') {
        console.error('Error recording auth event:', result.error);
      }
      return result;
    });
  }
);
