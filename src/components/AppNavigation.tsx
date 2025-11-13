import { Watch, Heart, Plane, Calendar, Droplets, BarChart3, LogOut, BookHeart, Shield } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
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

const navItems = [
  { title: "Dashboard", url: "/", icon: BarChart3 },
  { title: "Collection", url: "/collection", icon: Watch },
  { title: "Wishlist", url: "/wishlist", icon: Heart },
  { title: "Trips", url: "/trips", icon: Plane },
  { title: "Events", url: "/events", icon: Calendar },
  { title: "Water Usage", url: "/water-usage", icon: Droplets },
  { title: "Collection Insights", url: "/personal-notes", icon: BookHeart },
];

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
    ...(isAdmin ? [{ title: "Admin", url: "/admin", icon: Shield }] : []),
  ];

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-lg font-bold">
            {open && "Watch Tracker"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <NavLink
                        to={item.url}
                        className="flex items-center gap-3"
                        activeClassName="bg-primary/10 text-primary font-medium"
                      >
                        <item.icon className="w-5 h-5" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter>
        {open && user && (
          <div className="space-y-2">
            <div className="px-2 py-1 text-xs text-muted-foreground truncate">
              {user.email}
            </div>
            <Button
              onClick={signOut}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
