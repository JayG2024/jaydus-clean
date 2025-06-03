// Script to update imports from SupabaseAuthContext to ClerkAuthContext
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// Files to update
const filesToUpdate = [
  'src/layouts/AuthLayout.tsx',
  'src/components/layout/Sidebar.tsx',
  'src/components/layout/Navbar.tsx',
  'src/pages/auth/SignupPage.tsx',
  'src/pages/auth/ForgotPasswordPage.tsx',
  'src/pages/dashboard/DashboardPage.tsx',
  'src/pages/auth/LoginPage.tsx',
  'src/components/ui/CustomerPortalButton.tsx',
  'src/pages/management/UpgradePage.tsx',
  'src/components/ui/StripeCheckoutButton.tsx',
  'src/pages/tools/ChatPage.tsx',
  'src/pages/management/ProfilePage.tsx',
  'src/pages/tools/ImagesPage.tsx',
  'src/pages/management/SettingsPage.tsx',
  'src/pages/tools/AssistantsPage.tsx',
  'src/pages/tools/VoicePage.tsx',
];

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function updateImports() {
  for (const filePath of filesToUpdate) {
    try {
      const fullPath = path.join(path.dirname(__dirname), filePath);
      const content = await readFile(fullPath, 'utf8');
      
      // Replace import statements
      const updatedContent = content
        .replace(
          /import\s+{([^}]*)}\s+from\s+['"]\.\.\/context\/SupabaseAuthContext['"];?/g,
          'import {$1} from "../context/ClerkAuthContext";'
        )
        .replace(
          /import\s+{([^}]*)}\s+from\s+['"]\.\.\/\.\.\/context\/SupabaseAuthContext['"];?/g,
          'import {$1} from "../../context/ClerkAuthContext";'
        );
      
      await writeFile(fullPath, updatedContent, 'utf8');
      console.log(`Updated imports in ${filePath}`);
    } catch (error) {
      console.error(`Error updating ${filePath}:`, error);
    }
  }
}

updateImports().then(() => {
  console.log('All imports updated successfully');
}).catch(err => {
  console.error('Error updating imports:', err);
});