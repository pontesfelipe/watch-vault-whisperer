import { Home, Camera, Rss, User, Search, Settings } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { UserAvatarById } from "@/components/UserAvatarById";
import { Button } from "@/components/ui/button";


const navItems = [
  { title: "Home", url: "/home", icon: Home },
  { title: "Log", url: "/log", icon: Camera },
  { title: "Feed", url: "/feed", icon: Rss },
  { title: "Profile", url: "/profile", icon: User },
];

export function NewSideNavigation() {
  const location = useLocation();
  const { user, signOut } = useAuth();

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen border-r border-border bg-background sticky top-0">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-lg">
            SV
          </div>
          <div>
            <h1 className="font-semibold text-foreground">Sora Vault</h1>
            <p className="text-xs text-muted-foreground">Watch Collection</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="p-4">
        <NavLink
          to="/search"
          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <Search className="h-5 w-5" />
          <span className="text-sm">Search...</span>
        </NavLink>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.url;
          return (
            <NavLink
              key={item.title}
              to={item.url}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              activeClassName="bg-primary/10 text-primary font-medium"
            >
              <item.icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
              <span>{item.title}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer - Settings & User */}
      <div className="p-4 border-t border-border space-y-3">
        <NavLink
          to="/settings"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
            location.pathname === "/settings"
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <Settings className="h-5 w-5" />
          <span>Settings</span>
        </NavLink>

        {user && (
          <div className="flex items-center gap-3 px-4 py-2">
            <UserAvatarById userId={user.id} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user.email?.split('@')[0]}
              </p>
              <Button
                variant="link"
                size="sm"
                onClick={signOut}
                className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
              >
                Sign Out
              </Button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
