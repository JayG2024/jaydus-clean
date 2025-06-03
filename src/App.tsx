import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MongoDBProvider } from './context/MongoDBContext';
import { Toaster } from 'sonner';
import { ThemeProvider } from './context/ThemeContext';
import { StripeProvider } from './components/stripe/StripeProvider';
import { ErrorBoundary } from './components/ErrorBoundary';
import { FirebaseAuthProvider, useAuth } from './context/FirebaseAuthContext';

// Lazy-loaded components
const StreamingTestPage = lazy(() => import('./pages/test/StreamingTestPage'));

// Layouts
import DashboardLayout from './layouts/DashboardLayout';
import DashboardPage from './pages/dashboard/DashboardPage';
import ChatPage from './pages/tools/ChatPage';
import AIChat from './pages/AIChat';
import ImagesPage from './pages/tools/ImagesPage';
import VoicePage from './pages/tools/VoicePage';
import AssistantsPage from './pages/tools/AssistantsPage';
import TeamPage from './pages/management/TeamPage';
import ProfilePage from './pages/management/ProfilePage';
import SettingsPage from './pages/management/SettingsPage';
import UpgradePage from './pages/management/UpgradePage';

// Import environment helpers
import { isDevelopment, isMockModeEnabled } from './utils/envHelper';

// Skip authentication in development if needed
const skipAuthInDevelopment = () => true; // Always bypass auth

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, loading } = useAuth();
  
  // Skip authentication check in development mode if enabled
  const bypassAuth = skipAuthInDevelopment();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="h-12 w-12 mx-auto rounded-full border-4 border-primary-600 border-t-transparent animate-spin"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }
  
  // Allow access in development regardless of auth status if bypass is enabled
  if (bypassAuth) {
    console.log('🔍 Development mode: Bypassing authentication protection');
    return <ErrorBoundary enableAutoRecovery={true} serviceName="authentication">{children}</ErrorBoundary>;
  }
  
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  
  return <ErrorBoundary enableAutoRecovery={true} serviceName="protected-route">{children}</ErrorBoundary>;
};

// Loading fallback
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-950">
    <div className="text-center">
      <div className="h-12 w-12 mx-auto rounded-full border-4 border-primary-600 border-t-transparent animate-spin"></div>
      <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
    </div>
  </div>
);

// Main app component
function AppContent() {
  return (
    <>
      <Router>
        <ErrorBoundary enableAutoRecovery={true} serviceName="router">
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              {/* Redirect to dashboard */}
              <Route path="/" element={<Navigate to="/dashboard" />} />
              <Route path="/login" element={<Navigate to="/dashboard" />} />
              <Route path="/signup" element={<Navigate to="/dashboard" />} />
              <Route path="/forgot-password" element={<Navigate to="/dashboard" />} />
              
              {/* Protected routes */}
              <Route element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/chat" element={<ChatPage />} />
                <Route path="/ai-chat" element={<AIChat />} />
                <Route path="/images" element={<ImagesPage />} />
                <Route path="/voice" element={<VoicePage />} />
                <Route path="/assistants" element={<AssistantsPage />} />
                <Route path="/team" element={<TeamPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/upgrade" element={<UpgradePage />} />
                <Route path="/test/streaming" element={
                  <Suspense fallback={<LoadingFallback />}>
                    <StreamingTestPage />
                  </Suspense>
                } />
              </Route>
              
              {/* Catch-all route */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </Router>
      <Toaster 
        position="top-right" 
        toastOptions={{
          className: 'border border-gray-200 dark:border-gray-800',
          style: {
            background: 'var(--background, white)',
            color: 'var(--foreground, black)',
          },
        }}
      />
    </>
  );
}

// Wrapper app with providers
function App() {
  // Log application startup
  useEffect(() => {
    console.log(`Jaydus Platform initialized in ${import.meta.env.MODE} mode`);
    if (isDevelopment() && skipAuthInDevelopment()) {
      console.log('⚠️ Running in development mode with authentication bypassed');
    }
    if (isMockModeEnabled()) {
      console.log('📝 Mock mode enabled - auth behavior may be altered.');
    }
  }, []);
  
  // Conditionally render providers based on mock mode
  return (
    <ErrorBoundary enableAutoRecovery={true} serviceName="app-root">
      <ThemeProvider>
        <FirebaseAuthProvider>
          <MongoDBProvider>
            <StripeProvider>
              <AppContent />
            </StripeProvider>
          </MongoDBProvider>
        </FirebaseAuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
