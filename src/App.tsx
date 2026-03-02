import { useState, lazy, Suspense } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { PasscodeProvider } from '@/contexts/PasscodeContext';
import { CollectionProvider } from '@/contexts/CollectionContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AppLayout } from '@/components/AppLayout';
import { SplashScreen } from '@/components/SplashScreen';

// Eagerly load critical routes
import Dashboard from './pages/Dashboard';
import Auth from './pages/Auth';

// Lazy load heavy/less-critical routes
const Collection = lazy(() => import('./pages/Collection'));
const UsageDetails = lazy(() => import('./pages/UsageDetails'));
const PersonalNotes = lazy(() => import('./pages/PersonalNotes'));
const Social = lazy(() => import('./pages/Social'));
const WatchDetail = lazy(() => import('./pages/WatchDetail'));
const Admin = lazy(() => import('./pages/Admin'));
const WearLogsAdmin = lazy(() => import('./pages/WearLogsAdmin'));
const Settings = lazy(() => import('./pages/Settings'));
const FAQ = lazy(() => import('./pages/FAQ'));
const About = lazy(() => import('./pages/About'));
const VaultPal = lazy(() => import('./pages/VaultPal'));
const NotFound = lazy(() => import('./pages/NotFound'));

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

// Loading component for lazy-loaded routes
const RouteLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

function AppContent() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <>
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<RouteLoader />}>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Dashboard />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/vault-pal"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <VaultPal />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/collection"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Collection />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route path="/wishlist" element={<Navigate to="/collection" replace />} />
            <Route path="/trips" element={<Navigate to="/usage-details?tab=trips" replace />} />
            <Route
              path="/usage-details"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <UsageDetails />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/personal-notes"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <PersonalNotes />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/social"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Social />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route path="/messages" element={<Navigate to="/social?tab=messages" replace />} />
            <Route path="/forum" element={<Navigate to="/social?tab=forum" replace />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <Admin />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/wear-logs"
              element={
                <ProtectedRoute>
                  <WearLogsAdmin />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/watch/:id"
              element={
                <ProtectedRoute>
                  <WatchDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faq"
              element={
                <ProtectedRoute>
                  <FAQ />
                </ProtectedRoute>
              }
            />
            <Route
              path="/about"
              element={
                <ProtectedRoute>
                  <About />
                </ProtectedRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <PasscodeProvider>
          <CollectionProvider>
            <TooltipProvider>
              <AppContent />
            </TooltipProvider>
          </CollectionProvider>
        </PasscodeProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
