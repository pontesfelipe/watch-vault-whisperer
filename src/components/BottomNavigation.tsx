import { BarChart3, Watch, Settings, Bot, Users } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { triggerHaptic } from "@/utils/haptics";

const navItems = [
  { title: "Home", url: "/", icon: BarChart3 },
  { title: "Collection", url: "/collection", icon: Watch },
  { title: "Vault Pal", url: "/vault-pal", icon: Bot },
  { title: "Social", url: "/social", icon: Users },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function BottomNavigation() {
  const location = useLocation();

  const handleNavClick = () => {
    triggerHaptic('selection');
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-borderSubtle md:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.url;
          return (
            <NavLink
              key={item.title}
              to={item.url}
              onClick={handleNavClick}
              className={`flex flex-col items-center justify-center flex-1 h-full py-2 transition-colors touch-target ${
                isActive
                  ? "text-accent"
                  : "text-textMuted"
              }`}
              activeClassName="text-accent"
            >
              <item.icon className={`h-6 w-6 mb-1 ${isActive ? "text-accent" : ""}`} />
              <span className={`text-[10px] font-medium ${isActive ? "text-accent" : ""}`}>
                {item.title}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
