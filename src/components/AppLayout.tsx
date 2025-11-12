import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppNavigation } from "./AppNavigation";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppNavigation />
        <main className="flex-1 overflow-auto w-full">
          <div className="sticky top-0 z-10 flex items-center h-14 border-b border-border bg-background px-4">
            <SidebarTrigger />
          </div>
          <div className="p-4 md:p-6 max-w-[1800px] mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
