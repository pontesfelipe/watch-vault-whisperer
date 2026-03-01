import { BarChart3, Library, MessageCircle, MessageSquare, MoreHorizontal } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCollection } from "@/contexts/CollectionContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  Watch, Heart, Plane, Calendar, Droplets, BookHeart, Shield,
  Settings, HelpCircle, Info, Lightbulb,
} from "lucide-react";
import { SubmitFeedbackDialog } from "@/components/SubmitFeedbackDialog";
import { cn } from "@/lib/utils";

const PRIMARY_NAV = [
  { title: "Dashboard", url: "/", icon: BarChart3 },
  { title: "Collection", url: "/collection", icon: Library },
  { title: "Messages", url: "/messages", icon: MessageCircle },
  { title: "Forum", url: "/forum", icon: MessageSquare },
];

export function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);
  const { currentCollectionConfig } = useCollection();
  const { isAdmin, user, signOut } = useAuth();

  const moreItems = [
    { title: "Wishlist", url: "/wishlist", icon: Heart },
    { title: "Trips", url: "/trips", icon: Plane },
    { title: "Events", url: "/events", icon: Calendar },
    { title: "Water Usage", url: "/water-usage", icon: Droplets },
    { title: "Collection Insights", url: "/personal-notes", icon: BookHeart },
    { title: "Settings", url: "/settings", icon: Settings },
    { title: "FAQ", url: "/faq", icon: HelpCircle },
    { title: "About", url: "/about", icon: Info },
    ...(isAdmin ? [{ title: "Admin", url: "/admin", icon: Shield }] : []),
  ];

  const isMoreActive = moreItems.some((item) => location.pathname === item.url);

  const handleNav = (url: string) => {
    navigate(url);
    setMoreOpen(false);
  };

  // Map the Collection tab icon to the current collection type
  const collectionIcon = currentCollectionConfig?.icon ?? "📦";

  return (
    <>
      {/* Bottom navigation bar — only visible on mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        {PRIMARY_NAV.map((item) => {
          const isCollection = item.url === "/collection";
          const isActive = location.pathname === item.url;

          return (
            <button
              key={item.url}
              onClick={() => navigate(item.url)}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
                isActive ? "text-accent" : "text-muted-foreground hover:text-foreground"
              )}
              aria-label={item.title}
            >
              {isCollection ? (
                <span className="text-xl leading-none">{collectionIcon}</span>
              ) : (
                <item.icon
                  className={cn("h-5 w-5", isActive && "stroke-[2.5px]")}
                />
              )}
              <span className={cn(isActive && "font-semibold")}>
                {isCollection ? currentCollectionConfig?.plural ?? "Collection" : item.title}
              </span>
            </button>
          );
        })}

        {/* More button */}
        <button
          onClick={() => setMoreOpen(true)}
          className={cn(
            "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
            isMoreActive || moreOpen
              ? "text-accent"
              : "text-muted-foreground hover:text-foreground"
          )}
          aria-label="More"
        >
          <MoreHorizontal
            className={cn(
              "h-5 w-5",
              (isMoreActive || moreOpen) && "stroke-[2.5px]"
            )}
          />
          <span className={cn((isMoreActive || moreOpen) && "font-semibold")}>
            More
          </span>
        </button>
      </nav>

      {/* "More" sheet */}
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl pb-4 max-h-[85dvh] overflow-y-auto">
          <SheetHeader className="mb-4 text-left">
            <SheetTitle className="text-base">More</SheetTitle>
          </SheetHeader>

          <div className="grid grid-cols-4 gap-3">
            {moreItems.map((item) => {
              const isActive = location.pathname === item.url;
              return (
                <button
                  key={item.url}
                  onClick={() => handleNav(item.url)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-xl p-3 text-xs font-medium transition-colors",
                    isActive
                      ? "bg-accent/10 text-accent"
                      : "text-foreground hover:bg-accent/5"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-2xl",
                      isActive ? "bg-accent text-accent-foreground" : "bg-muted"
                    )}
                  >
                    <item.icon className="h-6 w-6" />
                  </div>
                  <span className="text-center leading-tight">{item.title}</span>
                </button>
              );
            })}

            {/* Feedback button */}
            {user && (
              <SubmitFeedbackDialog>
                <button
                  className="flex flex-col items-center gap-2 rounded-xl p-3 text-xs font-medium text-foreground hover:bg-accent/5 transition-colors"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
                    <Lightbulb className="h-6 w-6" />
                  </div>
                  <span>Feedback</span>
                </button>
              </SubmitFeedbackDialog>
            )}
          </div>

          {/* Sign out */}
          {user && (
            <div className="mt-6 border-t pt-4">
              <div className="mb-2 text-xs text-muted-foreground truncate px-1">
                {user.email}
              </div>
              <button
                onClick={signOut}
                className="w-full rounded-xl p-3 text-sm text-destructive hover:bg-destructive/10 text-left font-medium transition-colors"
              >
                Sign out
              </button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
