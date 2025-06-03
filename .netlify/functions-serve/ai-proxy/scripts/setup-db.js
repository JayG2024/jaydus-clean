const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
  console.log('Setting up Jaydus Platform database...');

  try {
    // Create demo user
    console.log('Creating demo user...');
    
    // Check if demo user exists in auth
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error('Error checking for existing users:', userError);
    } else {
      const existingDemoUser = userData.users.find(user => user.email === 'developer@example.com');
      
      if (existingDemoUser) {
        console.log('Demo user already exists in auth system');
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
    
    // Check if demo user profile exists
    const { data: existingProfiles, error: profileError } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'developer@example.com')
      .limit(1);
      
    if (profileError) {
      console.error('Error checking for existing user profile:', profileError);
    } else if (!existingProfiles || existingProfiles.length === 0) {
      // Create demo user profile
      console.log('Creating demo user profile in database');
      
      // Either use the auth user ID or generate a new one
      const userId = userData?.users.find(u => u.email === 'developer@example.com')?.id || 'demo-user-123';
      
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

    console.log('Database setup complete!');
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  }
}

setupDatabase();