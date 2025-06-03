import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { validateEnvironment } from './utils/validateEnv';
import { logError, ErrorSeverity } from './utils/errorLogger';

// Check for required environment variables
const isEnvValid = validateEnvironment();

if (!isEnvValid && import.meta.env.PROD) {
  // Log the error but still attempt to render the app
  logError(
    'Missing or invalid environment variables',
    {
      message: 'Application may not function correctly due to missing environment variables',
      tags: ['startup', 'config-error']
    },
    ErrorSeverity.WARNING
  );
}

// Global error handler for uncaught exceptions
window.addEventListener('error', (event) => {
  logError(event.error || new Error(event.message), {
    message: 'Uncaught error',
    context: {
      fileName: event.filename,
      lineNumber: event.lineno,
      columnNumber: event.colno
    },
    tags: ['uncaught', 'global']
  });
});

// Global handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  logError(event.reason || new Error('Unhandled Promise rejection'), {
    message: 'Unhandled Promise rejection',
    tags: ['unhandled-promise', 'global']
  });
});

// Initialize and render the app
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);