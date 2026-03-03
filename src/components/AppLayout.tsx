import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppNavigation } from "./AppNavigation";
import { BottomNavigation } from "./BottomNavigation";
import { WarrantyNotifications } from "./WarrantyNotifications";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { AnimatePresence, motion } from "framer-motion";
import { WifiOff } from "lucide-react";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const isOnline = useOnlineStatus();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        {/* Desktop sidebar - hidden on mobile */}
        <div className="hidden md:block">
          <AppNavigation />
        </div>
        
        <main className="flex-1 overflow-auto w-full pb-20 md:pb-0">
          {/* Offline banner */}
          <AnimatePresence>
            {!isOnline && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="flex items-center justify-center gap-2 bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 text-xs font-medium py-2 px-4">
                  <WifiOff className="h-3.5 w-3.5" />
                  <span>You're offline — some features may be unavailable</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {/* Desktop header with sidebar trigger */}
          <div className="sticky top-0 z-10 hidden md:flex items-center justify-between h-14 border-b border-borderSubtle bg-background px-4">
            <SidebarTrigger />
            <WarrantyNotifications />
          </div>
          
          {/* Mobile header - simpler without sidebar trigger */}
          <div className="sticky top-0 z-10 flex md:hidden items-center justify-between h-14 border-b border-borderSubtle bg-background px-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accentSubtle text-xs font-semibold text-accent">
                SV
              </div>
              <span className="text-sm font-semibold text-textMain">Sora Vault</span>
            </div>
            <WarrantyNotifications />
          </div>
          
          <div className="p-4 md:p-6 max-w-[1800px] mx-auto w-full">
            {children}
          </div>
        </main>
        
        {/* Mobile bottom navigation */}
        <BottomNavigation />
      </div>
    </SidebarProvider>
  );
}
