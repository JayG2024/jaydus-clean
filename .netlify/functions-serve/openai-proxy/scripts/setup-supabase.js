import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

// Initialize Supabase client with service role key for admin privileges
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupSupabase() {
  try {
    console.log('Starting Supabase setup process...');
    
    // Step 1: Apply migrations to create schema and tables
    console.log('Step 1: Applying migrations...');
    
    try {
      // Read the migration file
      const migrationPath = path.join(__dirname, '../supabase/migrations/20250517113435_spring_smoke.sql');
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      
      // Split the SQL into individual statements
      // This is a simple approach and might not work for all SQL statements
      const statements = migrationSQL
        .split(';')
        .map(statement => statement.trim())
        .filter(statement => statement.length > 0);
      
      console.log(`Found ${statements.length} SQL statements to execute`);
      
      // Execute each statement
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        console.log(`Executing statement ${i + 1}/${statements.length}...`);
        
        try {
          // Use Supabase's REST API to execute SQL
          const { error } = await supabase.rpc('pgrest_exec', { query: statement });
          
          if (error) {
            console.error(`Error executing statement ${i + 1}:`, error);
            // Continue with other statements
          } else {
            console.log(`Statement ${i + 1} executed successfully`);
          }
        } catch (err) {
          console.error(`Error executing statement ${i + 1}:`, err);
          // Continue with other statements
        }
      }
    } catch (error) {
      console.error('Error applying migrations:', error);
      console.log('Continuing with setup...');
    }
    
    // Step 2: Create demo user
    console.log('Step 2: Creating demo user...');
    
    // Check if demo user exists in auth
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error checking for existing auth users:', authError);
    } else {
      const existingDemoUser = authUsers.users.find(user => user.email === 'developer@example.com');
      
      if (existingDemoUser) {
        console.log('Demo user already exists in auth system:', existingDemoUser.id);
      } else {
        console.log('Creating demo user in auth system');
        
        try {
          // Create demo user in auth
          const { data, error } = await supabase.auth.admin.createUser({
            email: 'developer@example.com',
            password: 'demo12345',
            email_confirm: true,
            user_metadata: {
              display_name: 'Demo Developer'
            }
          });
          
          if (error) {
            console.error('Error creating demo auth user:', error);
          } else {
            console.log('Demo auth user created successfully:', data.user.id);
          }
        } catch (e) {
          console.error('Failed to create demo user in auth:', e);
          // Continue with the setup - we can still create the profile
        }
      }
    }
    
    // Check if demo user profile exists in the users table
    const { data: existingProfiles, error: profileCheckError } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'developer@example.com')
      .limit(1);
      
    if (profileCheckError) {
      console.error('Error checking for existing user profile:', profileCheckError);
    } else if (!existingProfiles || existingProfiles.length === 0) {
      // Create demo user profile
      console.log('Creating demo user profile in database');
      
      // Either use the auth user ID or generate a new one
      const userId = authUsers?.users.find(u => u.email === 'developer@example.com')?.id || 'demo-user-123';
      
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: 'developer@example.com',
          display_name: 'Demo Developer',
          role: 'admin',
          subscription: 'free',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_login: new Date().toISOString(),
        });
        
      if (insertError) {
        console.error('Error creating user profile:', insertError);
      } else {
        console.log('Demo user profile created successfully');
      }
    } else {
      console.log('Demo user profile already exists in database');
    }

    // Step 3: Initialize usage record for demo user
    console.log('Step 3: Setting up usage record...');
    
    const demoUserId = existingProfiles?.[0]?.id || 
                      authUsers?.users.find(u => u.email === 'developer@example.com')?.id || 
                      'demo-user-123';

    // Check if usage record exists
    const { data: existingUsage, error: usageCheckError } = await supabase
      .from('usage')
      .select('id')
      .eq('user_id', demoUserId)
      .limit(1);
      
    if (usageCheckError) {
      console.error('Error checking for existing usage record:', usageCheckError);
    } else if (!existingUsage || existingUsage.length === 0) {
      // Create usage record
      console.log('Creating usage record for demo user');
      
      const { error: insertError } = await supabase
        .from('usage')
        .insert({
          user_id: demoUserId,
          ai_credits_used: 240,
          chat_messages: 75,
          images_generated: 12,
          voice_minutes: 8,
          storage_used: 5242880, // 5MB in bytes
          last_updated: new Date().toISOString()
        });
        
      if (insertError) {
        console.error('Error creating usage record:', insertError);
      } else {
        console.log('Usage record created successfully');
      }
    } else {
      console.log('Usage record already exists for demo user');
    }

    // Step 4: Configure Stripe webhook function
    console.log('Step 4: Setup complete!');
    console.log('📌 Note: You will need to manually configure Stripe with the following steps:');
    console.log('   1. Set your Stripe publishable key in .env.local');
    console.log('   2. Set up stripe webhook settings in your Supabase project:');
    console.log('      - STRIPE_SECRET_KEY');
    console.log('      - STRIPE_WEBHOOK_SECRET');
    console.log('   3. Point your Stripe webhook to the Supabase Edge Function:');
    console.log('      https://[your-project-ref].supabase.co/functions/v1/stripe-webhook');

    console.log('\nSetup completed successfully!');
  } catch (error) {
    console.error('Error during setup:', error);
    process.exit(1);
  }
}

setupSupabase().catch(err => {
  console.error('Error setting up Supabase:', err);
  process.exit(1);
});