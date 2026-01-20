import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppNavigation } from "./AppNavigation";
import { BottomNavigation } from "./BottomNavigation";
import { WarrantyNotifications } from "./WarrantyNotifications";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        {/* Desktop sidebar - hidden on mobile */}
        <div className="hidden md:block">
          <AppNavigation />
        </div>
        
        <main className="flex-1 overflow-auto w-full pb-20 md:pb-0">
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
