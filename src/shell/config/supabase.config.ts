import { createClient } from '@supabase/supabase-js';

// Retrieve environment variables for Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create and export the Supabase client
export const supabaseClient = createClient(
  supabaseUrl,
  supabaseAnonKey
);

/**
 * Function to store authentication events in the Supabase event store
 * 
 * @param userId - The user's ID or email
 * @param command - The original command (user intent)
 * @param event - The resulting event (state change)
 * @returns A Promise with the result of the insert operation
 */
export const storeAuthEvent = (userId: string, command: any, event: any): Promise<any> => {
  try {
    const result = supabaseClient
      .from('auth_event_store')
      .insert([{ 
        user_id: userId, 
        command, 
        event,
        timestamp: new Date().toISOString()
      }]);
    
    // Convert to a standard Promise
    return Promise.resolve(result);
  } catch (error) {
    console.error('Error storing auth event:', error);
    return Promise.resolve({ error });
  }
};
