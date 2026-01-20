import { Watch, BarChart3, BookHeart, Shield, Settings, HelpCircle, Info, Lightbulb, Bot, ClipboardList, Users } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { SubmitFeedbackDialog } from "@/components/SubmitFeedbackDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useCollection } from "@/contexts/CollectionContext";
import { isWatchCollection } from "@/types/collection";
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
  const { currentCollection } = useCollection();
  
  const isWatches = currentCollection ? isWatchCollection(currentCollection.collection_type) : true;

  const mainNavItems = [
    { title: "Dashboard", url: "/", icon: BarChart3 },
    { title: "My Vault Pal", url: "/vault-pal", icon: Bot },
    { title: "Collection", url: "/collection", icon: Watch },
    { title: "Usage Details", url: "/usage-details", icon: ClipboardList },
    { title: "Collection Insights", url: "/personal-notes", icon: BookHeart },
    { title: "Social", url: "/social", icon: Users },
  ];

  const utilityNavItems = [
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
      <SidebarContent className="flex flex-col h-full">
        <SidebarGroup className="flex-1">
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
                  Luxury collection studio
                </div>
              </div>
            )}
          </div>
          <SidebarMenu className="space-y-1 px-2">
            {mainNavItems.map((item) => {
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
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="bg-accentSubtle/30 border-t border-accent/20 px-2 py-3">
        <SidebarMenu className="space-y-1">
          {user && (
            <SidebarMenuItem>
              <SubmitFeedbackDialog>
                <SidebarMenuButton
                  className={`w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors text-textMuted hover:bg-surfaceMuted hover:text-textMain ${!open ? "justify-center" : ""}`}
                >
                  <Lightbulb className="h-5 w-5" />
                  {open && <span>Feedback</span>}
                </SidebarMenuButton>
              </SubmitFeedbackDialog>
            </SidebarMenuItem>
          )}
          {utilityNavItems.map((item) => {
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
        
        {user && open && (
          <div className="mt-2 px-3">
            <p className="text-xs text-sidebar-foreground truncate mb-2">{user.email}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="w-full justify-start text-sidebar-foreground hover:text-sidebar-accent-foreground px-0"
            >
              Sign Out
            </Button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
