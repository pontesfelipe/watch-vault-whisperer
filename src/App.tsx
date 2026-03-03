import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { PasscodeProvider } from "@/contexts/PasscodeContext";
import { CollectionProvider } from "@/contexts/CollectionContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AppLayout } from "@/components/AppLayout";
import { SplashScreen } from "@/components/SplashScreen";
import { PageTransition } from "@/components/PageTransition";
import { useOfflineQueue } from "@/hooks/useOfflineQueue";
import Dashboard from "./pages/Dashboard";
import Collection from "./pages/Collection";

import UsageDetails from "./pages/UsageDetails";
import PersonalNotes from "./pages/PersonalNotes";
import Social from "./pages/Social";
import WatchDetail from "./pages/WatchDetail";
import Admin from "./pages/Admin";
import WearLogsAdmin from "./pages/WearLogsAdmin";
import Auth from "./pages/Auth";
import Settings from "./pages/Settings";
import FAQ from "./pages/FAQ";
import About from "./pages/About";
import VaultPal from "./pages/VaultPal";
import NotFound from "./pages/NotFound";

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
  useOfflineQueue();

  return (
    <>
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<ProtectedRoute><AppLayout><PageTransition><Dashboard /></PageTransition></AppLayout></ProtectedRoute>} />
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
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
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
