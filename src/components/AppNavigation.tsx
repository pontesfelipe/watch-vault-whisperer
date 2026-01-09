import { Watch, Heart, Plane, Calendar, Droplets, BarChart3, LogOut, BookHeart, Shield, Settings, MessageCircle, HelpCircle, Info, MessageSquare, Lightbulb } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { SubmitFeedbackDialog } from "@/components/SubmitFeedbackDialog";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  useSidebar,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

export function AppNavigation() {
  const { open } = useSidebar();
  const location = useLocation();
  const { user, isAdmin, signOut } = useAuth();

  const navItems = [
    { title: "Dashboard", url: "/", icon: BarChart3 },
    { title: "Collection", url: "/collection", icon: Watch },
    { title: "Wishlist", url: "/wishlist", icon: Heart },
    { title: "Trips", url: "/trips", icon: Plane },
    { title: "Events", url: "/events", icon: Calendar },
    { title: "Water Usage", url: "/water-usage", icon: Droplets },
    { title: "Collection Insights", url: "/personal-notes", icon: BookHeart },
    { title: "Messages", url: "/messages", icon: MessageCircle },
    { title: "Forum", url: "/forum", icon: MessageSquare },
    { title: "Settings", url: "/settings", icon: Settings },
    { title: "FAQ", url: "/faq", icon: HelpCircle },
    { title: "About", url: "/about", icon: Info },
    ...(isAdmin ? [{ title: "Admin", url: "/admin", icon: Shield }] : []),
  ];

  return (
    <Sidebar
      className="border-sidebar-border bg-sidebar"
      variant="sidebar"
      collapsible="icon"
    >
      <SidebarContent>
        <SidebarGroup>
          <div className={`mb-6 ${open ? "px-4" : "px-2"} pt-6 transition-all duration-200 flex items-center gap-2`}>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accentSubtle text-xs font-semibold text-accent">
              SV
            </div>
            {open && (
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-textSoft">
                  Sora Vault
                </div>
                <div className="text-xs text-textMuted">
                  Watch collection studio
                </div>
              </div>
            )}
          </div>
          <SidebarMenu className="space-y-1 px-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.url;
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive}>
                    <NavLink
                      to={item.url}
                      className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors ${
                        isActive
                          ? "bg-accentSubtle text-textMain"
                          : "text-textMuted hover:bg-surfaceMuted hover:text-textMain"
                      }`}
                      activeClassName="bg-accentSubtle text-textMain"
                    >
                      <item.icon className="h-5 w-5" />
                      {open && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
          
          {user && (
            <div className={`mt-4 ${open ? "px-2" : "px-1"}`}>
              <SubmitFeedbackDialog>
                <SidebarMenuButton
                  className={`w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors text-textMuted hover:bg-surfaceMuted hover:text-textMain ${!open ? "justify-center" : ""}`}
                >
                  <Lightbulb className="h-5 w-5" />
                  {open && <span>Feedback</span>}
                </SidebarMenuButton>
              </SubmitFeedbackDialog>
            </div>
          )}
        </SidebarGroup>
      </SidebarContent>
      {user && open && (
        <SidebarFooter className="border-t border-sidebar-border px-4 py-4">
          <div className="flex flex-col gap-2">
            <p className="text-xs text-sidebar-foreground truncate">{user.email}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="justify-start text-sidebar-foreground hover:text-sidebar-accent-foreground"
            >
              Sign Out
            </Button>
          </div>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
