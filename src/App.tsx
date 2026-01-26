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
import { SplashScreen } from "@/components/SplashScreen";

// New pages
import HomePage from "./pages/HomePage";
import LogPage from "./pages/LogPage";
import FeedPage from "./pages/FeedPage";
import ProfilePage from "./pages/ProfilePage";
import SearchPage from "./pages/SearchPage";

// Legacy pages (for backwards compatibility)
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
import { AppLayout } from "@/components/AppLayout";

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

function AppContent() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <>
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          
          {/* New simplified navigation */}
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="/log" element={<ProtectedRoute><LogPage /></ProtectedRoute>} />
          <Route path="/feed" element={<ProtectedRoute><FeedPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/profile/:userId" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
          
          {/* Legacy routes - redirect to new structure */}
          <Route path="/vault-pal" element={<Navigate to="/home" replace />} />
          <Route path="/collection" element={<Navigate to="/profile" replace />} />
          <Route path="/wishlist" element={<Navigate to="/profile" replace />} />
          <Route path="/trips" element={<Navigate to="/log" replace />} />
          <Route path="/usage-details" element={<Navigate to="/profile" replace />} />
          <Route path="/personal-notes" element={<Navigate to="/profile" replace />} />
          <Route path="/social" element={<Navigate to="/feed" replace />} />
          <Route path="/messages" element={<Navigate to="/feed" replace />} />
          <Route path="/forum" element={<Navigate to="/feed" replace />} />
          
          {/* Utility routes */}
          <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
          <Route path="/admin/wear-logs" element={<ProtectedRoute><WearLogsAdmin /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/watch/:id" element={<ProtectedRoute><WatchDetail /></ProtectedRoute>} />
          <Route path="/faq" element={<ProtectedRoute><FAQ /></ProtectedRoute>} />
          <Route path="/about" element={<ProtectedRoute><About /></ProtectedRoute>} />
          
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
