import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppNavigation } from "./AppNavigation";
import { WarrantyNotifications } from "./WarrantyNotifications";
import { CollectionSwitcher } from "./CollectionSwitcher";
import { MobileBottomNav } from "./MobileBottomNav";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        {/* Sidebar — icon-collapsible on desktop, sheet drawer on mobile */}
        <AppNavigation />

        <main className="flex-1 overflow-auto w-full min-w-0">
          {/* Sticky top header */}
          <header className="sticky top-0 z-10 flex items-center justify-between h-14 border-b border-borderSubtle bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-3 md:px-4 gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {/* Sidebar trigger — desktop only (mobile uses bottom nav) */}
              <SidebarTrigger className="hidden md:inline-flex flex-shrink-0" />
              {/* Collection switcher — always visible */}
              <div className="min-w-0 overflow-hidden">
                <CollectionSwitcher />
              </div>
            </div>
            <WarrantyNotifications />
          </header>

          {/* Page content — extra bottom padding on mobile for the tab bar */}
          <div className="p-4 md:p-6 max-w-[1800px] mx-auto w-full pb-24 md:pb-6">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile bottom tab bar — only rendered on small screens via CSS */}
      <MobileBottomNav />
    </SidebarProvider>
  );
}
