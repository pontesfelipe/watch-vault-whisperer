import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PasscodeProvider } from "@/contexts/PasscodeContext";
import { AppLayout } from "@/components/AppLayout";
import Dashboard from "./pages/Dashboard";
import Collection from "./pages/Collection";
import Wishlist from "./pages/Wishlist";
import Trips from "./pages/Trips";
import Events from "./pages/Events";
import WaterUsage from "./pages/WaterUsage";
import WatchDetail from "./pages/WatchDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <PasscodeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AppLayout><Dashboard /></AppLayout>} />
            <Route path="/collection" element={<AppLayout><Collection /></AppLayout>} />
            <Route path="/wishlist" element={<AppLayout><Wishlist /></AppLayout>} />
            <Route path="/trips" element={<AppLayout><Trips /></AppLayout>} />
            <Route path="/events" element={<AppLayout><Events /></AppLayout>} />
            <Route path="/water-usage" element={<AppLayout><WaterUsage /></AppLayout>} />
            <Route path="/watch/:id" element={<WatchDetail />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </PasscodeProvider>
  </QueryClientProvider>
);

export default App;
