/*
  # Fix Authentication and RLS Policies

  This migration fixes the row-level security policies to ensure
  proper authentication flows and database access.
*/

-- Enable RLS on users table if not already enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow public (including unauthenticated) access for service_role to users table
CREATE POLICY "Service role can do anything"
ON users
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Fix policies for users table
CREATE POLICY "Users can view own profile"
ON users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Insert policy for authenticated users
CREATE POLICY "Users can create their own profile"
ON users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Fix RLS for other tables
DO $$
DECLARE
  table_name text;
BEGIN
  FOR table_name IN
    SELECT tablename FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename IN ('usage', 'chats', 'api_keys', 'integrations')
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
    
    -- Create service role policies
    EXECUTE format(
      'CREATE POLICY "Service role can do anything on %1$I" ON %1$I FOR ALL TO service_role USING (true) WITH CHECK (true)',
      table_name
    );

    -- Create authenticated user policies
    EXECUTE format(
      'CREATE POLICY "Users can access own data in %1$I" ON %1$I FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())',
      table_name
    );
  END LOOP;
END
$$;

-- Add pgrest_exec function if it doesn't exist
-- This allows executing SQL statements from application code
CREATE OR REPLACE FUNCTION pgrest_exec(query text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  EXECUTE query;
  RETURN json_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM,
    'detail', SQLSTATE
  );
END;
$$;