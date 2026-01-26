import { ReactNode } from "react";
import { NewSideNavigation } from "./NewSideNavigation";
import { NewBottomNavigation } from "./NewBottomNavigation";
import { GlobalSearch } from "./GlobalSearch";

interface NewAppLayoutProps {
  children: ReactNode;
  showSearch?: boolean;
}

export function NewAppLayout({ children, showSearch = true }: NewAppLayoutProps) {
  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Desktop sidebar */}
      <NewSideNavigation />
      
      <main className="flex-1 overflow-auto w-full pb-20 md:pb-0">
        {/* Mobile header with search */}
        {showSearch && (
          <div className="sticky top-0 z-10 md:hidden bg-background/95 backdrop-blur-md border-b border-border px-4 py-3">
            <GlobalSearch />
          </div>
        )}
        
        <div className="max-w-3xl mx-auto w-full">
          {children}
        </div>
      </main>
      
      {/* Mobile bottom navigation */}
      <NewBottomNavigation />
    </div>
  );
}
