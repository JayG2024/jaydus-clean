// Script to deploy environment variables to Netlify
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

// Load environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Function to deploy environment variables to Netlify
function deployEnvVars() {
  console.log('🚀 Deploying environment variables to Netlify...');
  
  // Get the OpenAI API key
  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) {
    console.error('❌ No OpenAI API key found in environment variables');
    process.exit(1);
  }
  
  try {
    // Deploy the OpenAI API key to Netlify
    console.log('🔑 Deploying OpenAI API key...');
    execSync(`netlify env:set OPENAI_API_KEY "${openaiApiKey}"`, { stdio: 'inherit' });
    
    // Deploy other environment variables as needed
    // ...
    
    console.log('✅ Environment variables deployed successfully!');
  } catch (error) {
    console.error('❌ Failed to deploy environment variables:', error.message);
    process.exit(1);
  }
}

// Run the deployment function
deployEnvVars();