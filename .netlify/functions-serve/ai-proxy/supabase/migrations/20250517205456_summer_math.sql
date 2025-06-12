/*
  # Fix authentication RLS policies

  1. Security Changes
     - Add RLS policies to enable user management
     - Update existing RLS policies to allow authenticated users to update their own data
     
  2. User Management
     - Grant service role access to modify users table
     - Add policy to allow new user creation during signup
     - Add policy to allow users to update their own data
*/

-- Enable RLS on users table if not already enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy for users to read their own data
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' 
        AND policyname = 'Users can read own data'
    ) THEN
        CREATE POLICY "Users can read own data"
        ON users
        FOR SELECT
        TO authenticated
        USING (auth.uid() = id);
    END IF;
END $$;

-- Create policy for users to update their own data
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' 
        AND policyname = 'Users can update own data'
    ) THEN
        CREATE POLICY "Users can update own data"
        ON users
        FOR UPDATE
        TO authenticated
        USING (auth.uid() = id);
    END IF;
END $$;

-- Create policy to allow service role to insert new users during signup
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' 
        AND policyname = 'Service role can insert users'
    ) THEN
        CREATE POLICY "Service role can insert users"
        ON users
        FOR INSERT
        TO service_role
        WITH CHECK (true);
    END IF;
END $$;

-- Create policy to allow service role to update all users
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' 
        AND policyname = 'Service role can update all users'
    ) THEN
        CREATE POLICY "Service role can update all users"
        ON users
        FOR UPDATE
        TO service_role
        USING (true);
    END IF;
END $$;

-- Create policy for new user signup (to allow creating their own record)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' 
        AND policyname = 'Allow signup'
    ) THEN
        CREATE POLICY "Allow signup"
        ON users
        FOR INSERT
        TO authenticated
        WITH CHECK (auth.uid() = id);
    END IF;
END $$;

-- Check if api_keys table exists and apply RLS if it does
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'api_keys'
    ) THEN
        -- Enable RLS on api_keys table
        ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
        
        -- Create policy for users to read their own API keys
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'api_keys' 
            AND policyname = 'Users can read own API keys'
        ) THEN
            CREATE POLICY "Users can read own API keys"
            ON api_keys
            FOR SELECT
            TO authenticated
            USING (user_id = auth.uid());
        END IF;
        
        -- Create policy for users to insert their own API keys
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'api_keys' 
            AND policyname = 'Users can insert own API keys'
        ) THEN
            CREATE POLICY "Users can insert own API keys"
            ON api_keys
            FOR INSERT
            TO authenticated
            WITH CHECK (user_id = auth.uid());
        END IF;
        
        -- Create policy for users to update their own API keys
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'api_keys' 
            AND policyname = 'Users can update own API keys'
        ) THEN
            CREATE POLICY "Users can update own API keys"
            ON api_keys
            FOR UPDATE
            TO authenticated
            USING (user_id = auth.uid());
        END IF;
        
        -- Create policy for users to delete their own API keys
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'api_keys' 
            AND policyname = 'Users can delete own API keys'
        ) THEN
            CREATE POLICY "Users can delete own API keys"
            ON api_keys
            FOR DELETE
            TO authenticated
            USING (user_id = auth.uid());
        END IF;
    END IF;
END $$;

-- Check if integrations table exists and apply RLS if it does
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'integrations'
    ) THEN
        -- Enable RLS on integrations table
        ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
        
        -- Create policy for users to read their own integrations
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'integrations' 
            AND policyname = 'Users can read own integrations'
        ) THEN
            CREATE POLICY "Users can read own integrations"
            ON integrations
            FOR SELECT
            TO authenticated
            USING (user_id = auth.uid());
        END IF;
        
        -- Create policy for users to insert their own integrations
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'integrations' 
            AND policyname = 'Users can insert own integrations'
        ) THEN
            CREATE POLICY "Users can insert own integrations"
            ON integrations
            FOR INSERT
            TO authenticated
            WITH CHECK (user_id = auth.uid());
        END IF;
        
        -- Create policy for users to update their own integrations
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'integrations' 
            AND policyname = 'Users can update own integrations'
        ) THEN
            CREATE POLICY "Users can update own integrations"
            ON integrations
            FOR UPDATE
            TO authenticated
            USING (user_id = auth.uid());
        END IF;
        
        -- Create policy for users to delete their own integrations
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'integrations' 
            AND policyname = 'Users can delete own integrations'
        ) THEN
            CREATE POLICY "Users can delete own integrations"
            ON integrations
            FOR DELETE
            TO authenticated
            USING (user_id = auth.uid());
        END IF;
    END IF;
END $$;