-- Create auth_event_store table for Event Sourcing pattern
CREATE TABLE IF NOT EXISTS auth_event_store (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  command JSONB NOT NULL,
  event JSONB NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Add indexes for efficient querying
  CONSTRAINT auth_event_store_user_id_idx UNIQUE (user_id, timestamp)
);

-- Add RLS policies for secure access
ALTER TABLE auth_event_store ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can view their own events
CREATE POLICY "Users can view their own events"
  ON auth_event_store
  FOR SELECT
  USING (auth.uid()::text = user_id);

-- Only authenticated users can insert their own events
CREATE POLICY "Users can insert their own events"
  ON auth_event_store
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

-- Create a function to replay events for a user
CREATE OR REPLACE FUNCTION replay_auth_events(p_user_id TEXT)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT 
    jsonb_build_object(
      'user_id', p_user_id,
      'events', jsonb_agg(event ORDER BY timestamp),
      'last_event', event,
      'event_count', COUNT(*),
      'first_auth_at', MIN(timestamp),
      'last_auth_at', MAX(timestamp)
    ) INTO result
  FROM 
    auth_event_store
  WHERE 
    user_id = p_user_id;
    
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
