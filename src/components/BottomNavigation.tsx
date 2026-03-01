import { BarChart3, Watch, Bot, Users, Menu } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { triggerHaptic } from "@/utils/haptics";
import { useSocialNotifications } from "@/hooks/useSocialNotifications";
import { Badge } from "@/components/ui/badge";
import { MobileMenuDrawer } from "@/components/MobileMenuDrawer";

const navItems = [
  { title: "Home", url: "/", icon: BarChart3 },
  { title: "Collection", url: "/collection", icon: Watch },
  { title: "Assistant", url: "/vault-pal", icon: Bot },
  { title: "Social", url: "/social", icon: Users },
];

export function BottomNavigation() {
  const location = useLocation();
  const { totalCount } = useSocialNotifications();

  const handleNavClick = () => {
    triggerHaptic('selection');
  };

  const handleMenuClick = () => {
    triggerHaptic('selection');
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-borderSubtle md:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.url;
          const showBadge = item.url === "/social" && totalCount > 0;
          return (
            <NavLink
              key={item.title}
              to={item.url}
              onClick={handleNavClick}
              aria-label={item.title}
              aria-current={isActive ? "page" : undefined}
              className={`flex flex-col items-center justify-center flex-1 h-full py-2 transition-colors touch-target focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                isActive
                  ? "text-accent"
                  : "text-textMuted"
              }`}
              activeClassName="text-accent"
            >
              <div className="relative">
                <item.icon className={`h-6 w-6 mb-1 ${isActive ? "text-accent" : ""}`} />
                {showBadge && (
                  <Badge
                    className="absolute -top-1 -right-2 h-4 min-w-4 flex items-center justify-center text-[10px] p-0 bg-accent text-accent-foreground"
                    aria-label={`${totalCount} unread notifications`}
                  >
                    <span aria-hidden="true">{totalCount > 9 ? "9+" : totalCount}</span>
                  </Badge>
                )}
              </div>
              <span className={`text-[10px] font-medium ${isActive ? "text-accent" : ""}`}>
                {item.title}
              </span>
            </NavLink>
          );
        })}
        
        {/* Menu button to open drawer */}
        <MobileMenuDrawer>
          <button
            onClick={handleMenuClick}
            aria-label="Open menu"
            className="flex flex-col items-center justify-center flex-1 h-full py-2 transition-colors touch-target text-textMuted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <Menu className="h-6 w-6 mb-1" />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </MobileMenuDrawer>
      </div>
    </nav>
  );
}
