import React, { useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/SupabaseAuthContext';
import { Toaster } from 'sonner';
import { ThemeProvider } from './context/ThemeContext';
import { StripeProvider } from './components/stripe/StripeProvider';
import ErrorBoundary from './components/ui/ErrorBoundary';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';
import AuthLayout from './layouts/AuthLayout';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import ChatPage from './pages/tools/ChatPage';
import ImagesPage from './pages/tools/ImagesPage';
import VoicePage from './pages/tools/VoicePage';
import AssistantsPage from './pages/tools/AssistantsPage';
import TeamPage from './pages/management/TeamPage';
import ProfilePage from './pages/management/ProfilePage';
import SettingsPage from './pages/management/SettingsPage';
import UpgradePage from './pages/management/UpgradePage';

// Check if we're in development mode
const isLocalDevelopment = () => import.meta.env.DEV === true;

// Skip authentication in development if needed
const skipAuthInDevelopment = () => isLocalDevelopment() && true; // Set to 'true' to bypass auth in development

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
    return <ErrorBoundary>{children}</ErrorBoundary>;
  }
  
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  
  return <ErrorBoundary>{children}</ErrorBoundary>;
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
        <ErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<HomePage />} />
              
              {/* Auth routes */}
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              </Route>
              
              {/* Protected routes */}
              <Route element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/chat" element={<ChatPage />} />
                <Route path="/images" element={<ImagesPage />} />
                <Route path="/voice" element={<VoicePage />} />
                <Route path="/assistants" element={<AssistantsPage />} />
                <Route path="/team" element={<TeamPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/upgrade" element={<UpgradePage />} />
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
    if (isLocalDevelopment() && skipAuthInDevelopment()) {
      console.log('⚠️ Running in development mode with authentication bypassed');
    }
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <StripeProvider>
            <AppContent />
          </StripeProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;