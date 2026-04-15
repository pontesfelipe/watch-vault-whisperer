import { useState, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { PasscodeProvider } from "@/contexts/PasscodeContext";
import { ImpersonationProvider } from "@/contexts/ImpersonationContext";
import { ImpersonationBanner } from "@/components/ImpersonationBanner";
import { CollectionProvider } from "@/contexts/CollectionContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AppLayout } from "@/components/AppLayout";
import { SplashScreen } from "@/components/SplashScreen";
import { PageTransition } from "@/components/PageTransition";
import { useOfflineQueue } from "@/hooks/useOfflineQueue";
import { usePushNotifications } from "@/hooks/usePushNotifications";

// Eagerly loaded (critical path)
import Home from "./pages/Home";
import Auth from "./pages/Auth";

// Lazy-loaded
const Dashboard = lazy(() => import("./pages/Dashboard"));

// Lazy-loaded routes
const Collection = lazy(() => import("./pages/Collection"));
const UsageDetails = lazy(() => import("./pages/UsageDetails"));
const PersonalNotes = lazy(() => import("./pages/PersonalNotes"));
const Social = lazy(() => import("./pages/Social"));
const WatchDetail = lazy(() => import("./pages/WatchDetail"));
const Admin = lazy(() => import("./pages/Admin"));
const WearLogsAdmin = lazy(() => import("./pages/WearLogsAdmin"));
const Settings = lazy(() => import("./pages/Settings"));
const FAQ = lazy(() => import("./pages/FAQ"));
const About = lazy(() => import("./pages/About"));
const VaultPal = lazy(() => import("./pages/VaultPal"));
const UserProfile = lazy(() => import("./pages/UserProfile"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

function LazyFallback() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}

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

function AppContent() {
  const [showSplash, setShowSplash] = useState(true);
  const { user } = useAuth();
  useOfflineQueue();
  usePushNotifications();

  return (
    <>
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      <ImpersonationBanner />
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<LazyFallback />}>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<ProtectedRoute><AppLayout><PageTransition><Home /></PageTransition></AppLayout></ProtectedRoute>} />
            <Route path="/canvas" element={<ProtectedRoute><AppLayout><PageTransition><Dashboard /></PageTransition></AppLayout></ProtectedRoute>} />
            <Route path="/vault-pal" element={<ProtectedRoute><AppLayout><PageTransition><VaultPal /></PageTransition></AppLayout></ProtectedRoute>} />
            <Route path="/collection" element={<ProtectedRoute><AppLayout><PageTransition><Collection /></PageTransition></AppLayout></ProtectedRoute>} />
            <Route path="/wishlist" element={<Navigate to="/collection" replace />} />
            <Route path="/trips" element={<Navigate to="/usage-details?tab=trips" replace />} />
            <Route path="/usage-details" element={<ProtectedRoute><AppLayout><PageTransition><UsageDetails /></PageTransition></AppLayout></ProtectedRoute>} />
            <Route path="/personal-notes" element={<ProtectedRoute><AppLayout><PageTransition><PersonalNotes /></PageTransition></AppLayout></ProtectedRoute>} />
            <Route path="/social" element={<ProtectedRoute><AppLayout><PageTransition><Social /></PageTransition></AppLayout></ProtectedRoute>} />
            <Route path="/messages" element={<Navigate to="/social?tab=messages" replace />} />
            <Route path="/forum" element={<Navigate to="/social?tab=forum" replace />} />
            <Route path="/admin" element={<ProtectedRoute><PageTransition><Admin /></PageTransition></ProtectedRoute>} />
            <Route path="/admin/wear-logs" element={<ProtectedRoute><PageTransition><WearLogsAdmin /></PageTransition></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><PageTransition><Settings /></PageTransition></ProtectedRoute>} />
            <Route path="/watch/:id" element={<ProtectedRoute><PageTransition><WatchDetail /></PageTransition></ProtectedRoute>} />
            <Route path="/faq" element={<ProtectedRoute><PageTransition><FAQ /></PageTransition></ProtectedRoute>} />
            <Route path="/about" element={<ProtectedRoute><PageTransition><About /></PageTransition></ProtectedRoute>} />
            <Route path="/user/:id" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
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
          <ImpersonationProviderWrapper>
            <CollectionProvider>
              <TooltipProvider>
                <AppContent />
              </TooltipProvider>
            </CollectionProvider>
          </ImpersonationProviderWrapper>
        </PasscodeProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

function ImpersonationProviderWrapper({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return (
    <ImpersonationProvider realUserId={user?.id ?? null}>
      {children}
    </ImpersonationProvider>
  );
}

export default App;
