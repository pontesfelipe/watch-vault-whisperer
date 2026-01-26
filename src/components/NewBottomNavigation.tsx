import { Home, Camera, Rss, User } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { triggerHaptic } from "@/utils/haptics";

const navItems = [
  { title: "Home", url: "/home", icon: Home },
  { title: "Log", url: "/log", icon: Camera },
  { title: "Feed", url: "/feed", icon: Rss },
  { title: "Profile", url: "/profile", icon: User },
];

export function NewBottomNavigation() {
  const location = useLocation();

  const handleNavClick = () => {
    triggerHaptic('selection');
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border md:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.url;
          return (
            <NavLink
              key={item.title}
              to={item.url}
              onClick={handleNavClick}
              className={`flex flex-col items-center justify-center flex-1 h-full py-2 transition-all touch-target ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              activeClassName="text-primary"
            >
              <item.icon 
                className={`h-6 w-6 mb-1 transition-transform ${isActive ? "scale-110" : ""}`} 
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className={`text-[10px] font-medium ${isActive ? "font-semibold" : ""}`}>
                {item.title}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
