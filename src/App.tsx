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
import Dashboard from "./pages/Dashboard";
import Collection from "./pages/Collection";
import Wishlist from "./pages/Wishlist";
import Trips from "./pages/Trips";
import Events from "./pages/Events";
import WaterUsage from "./pages/WaterUsage";
import PersonalNotes from "./pages/PersonalNotes";
import Messages from "./pages/Messages";
import WatchDetail from "./pages/WatchDetail";
import Admin from "./pages/Admin";
import WearLogsAdmin from "./pages/WearLogsAdmin";
import Auth from "./pages/Auth";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <PasscodeProvider>
          <CollectionProvider>
            <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
                <Route path="/collection" element={<ProtectedRoute><AppLayout><Collection /></AppLayout></ProtectedRoute>} />
                <Route path="/wishlist" element={<ProtectedRoute><AppLayout><Wishlist /></AppLayout></ProtectedRoute>} />
                <Route path="/trips" element={<ProtectedRoute><AppLayout><Trips /></AppLayout></ProtectedRoute>} />
                <Route path="/events" element={<ProtectedRoute><AppLayout><Events /></AppLayout></ProtectedRoute>} />
                <Route path="/water-usage" element={<ProtectedRoute><AppLayout><WaterUsage /></AppLayout></ProtectedRoute>} />
                <Route path="/personal-notes" element={<ProtectedRoute><AppLayout><PersonalNotes /></AppLayout></ProtectedRoute>} />
                <Route path="/messages" element={<ProtectedRoute><AppLayout><Messages /></AppLayout></ProtectedRoute>} />
                <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
                <Route path="/admin/wear-logs" element={<ProtectedRoute><WearLogsAdmin /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/watch/:id" element={<ProtectedRoute><WatchDetail /></ProtectedRoute>} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </CollectionProvider>
        </PasscodeProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
