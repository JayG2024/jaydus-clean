import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './styles/clerk-overrides.css';
import { validateAppEnvVars } from './utils/envValidator';
import { logError, ErrorSeverity, AppError, initializeErrorMonitoring } from './utils/errorLogger';
import { checkServiceHealth, shouldAutoEnableMockMode } from './utils/apiKeyValidator';
import { initializeGracefulDegradation } from './utils/gracefulDegradation';

// Initialize error monitoring and handling systems
initializeErrorMonitoring();
initializeGracefulDegradation();

// Enhanced startup sequence with service health checks
async function initializeApplication() {
  try {
    // Check environment variables
    const isEnvValid = validateAppEnvVars();
    
    // Check service health
    const serviceHealth = await checkServiceHealth();
    
    // Auto-enable mock mode if services are unhealthy
    if (shouldAutoEnableMockMode(serviceHealth)) {
      localStorage.setItem('autoMockMode', 'true');
      localStorage.setItem('autoMockReason', 'Service health check failed during startup');
      
      logError(
        new AppError(
          'Auto-enabled mock mode due to service health issues',
          'AUTO_MOCK_MODE_STARTUP',
          ErrorSeverity.WARNING,
          { serviceHealth, envValid: isEnvValid },
          true
        ),
        {
          message: 'Mock mode automatically enabled for better user experience',
          context: { serviceHealth },
          tags: ['startup', 'mock-mode', 'auto-recovery']
        },
        ErrorSeverity.WARNING
      );
    }
    
    if (!isEnvValid && import.meta.env.PROD) {
      logError(
        new AppError(
          'Missing or invalid environment variables',
          'ENV_VALIDATION_ERROR',
          ErrorSeverity.WARNING,
          { production: true, serviceHealth },
          true
        ),
        {
          message: 'Application may not function correctly due to missing environment variables',
          tags: ['startup', 'config-error']
        },
        ErrorSeverity.WARNING
      );
    }
    
    // Log successful startup
    logError(
      new AppError(
        'Application startup completed',
        'STARTUP_SUCCESS',
        ErrorSeverity.INFO,
        { 
          envValid: isEnvValid,
          serviceHealth: serviceHealth.overall,
          mockModeEnabled: localStorage.getItem('autoMockMode') === 'true'
        },
        false
      ),
      {
        message: 'Lucky application successfully initialized',
        context: { 
          version: '1.0.0',
          environment: import.meta.env.MODE,
          timestamp: new Date().toISOString()
        },
        tags: ['startup', 'success']
      },
      ErrorSeverity.INFO
    );
    
  } catch (error) {
    // Handle initialization errors
    logError(
      error instanceof Error ? error : new Error('Application initialization failed'),
      {
        message: 'Critical error during application startup',
        context: { error: error instanceof Error ? error.message : 'Unknown error' },
        tags: ['startup', 'critical-error', 'initialization-failed']
      },
      ErrorSeverity.CRITICAL
    );
    
    // Enable mock mode as fallback
    localStorage.setItem('autoMockMode', 'true');
    localStorage.setItem('autoMockReason', 'Critical startup error - fallback mode');
  }
}

// Initialize application
initializeApplication();

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

// Enhanced error boundary wrapper
const AppWithErrorHandling = () => (
  <StrictMode>
    <App />
  </StrictMode>
);

// Initialize and render the app
createRoot(document.getElementById('root')!).render(
  <AppWithErrorHandling />
);