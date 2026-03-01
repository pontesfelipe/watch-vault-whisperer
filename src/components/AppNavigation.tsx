import {
  Watch, Heart, Plane, Calendar, Droplets, BarChart3, BookHeart,
  Shield, Settings, MessageCircle, HelpCircle, Info, MessageSquare,
  Lightbulb, LogOut,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { SubmitFeedbackDialog } from "@/components/SubmitFeedbackDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useCollection } from "@/contexts/CollectionContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

export function AppNavigation() {
  const { open, setOpenMobile } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, signOut } = useAuth();
  const { currentCollectionConfig } = useCollection();

  // Subtitle reflects the active collection type
  const subtitle = currentCollectionConfig
    ? `${currentCollectionConfig.plural.toLowerCase()} collection`
    : "collection studio";

  const collectionEmoji = currentCollectionConfig?.icon ?? "📦";
  const collectionLabel = currentCollectionConfig?.plural ?? "Collection";

  const navItems = [
    { title: "Dashboard",            url: "/",              icon: BarChart3 },
    { title: collectionLabel,        url: "/collection",    icon: Watch,          emoji: collectionEmoji },
    { title: "Wishlist",             url: "/wishlist",      icon: Heart },
    { title: "Trips",                url: "/trips",         icon: Plane },
    { title: "Events",               url: "/events",        icon: Calendar },
    { title: "Water Usage",          url: "/water-usage",   icon: Droplets },
    { title: "Collection Insights",  url: "/personal-notes",icon: BookHeart },
    { title: "Messages",             url: "/messages",      icon: MessageCircle },
    { title: "Forum",                url: "/forum",         icon: MessageSquare },
    { title: "Settings",             url: "/settings",      icon: Settings },
    { title: "FAQ",                  url: "/faq",           icon: HelpCircle },
    { title: "About",                url: "/about",         icon: Info },
    ...(isAdmin ? [{ title: "Admin", url: "/admin",         icon: Shield }] : []),
  ];

  // Close mobile sheet when the user taps a nav link
  const handleNavClick = (url: string) => {
    setOpenMobile(false);
    navigate(url);
  };

  return (
    <Sidebar
      className="border-sidebar-border bg-sidebar"
      variant="sidebar"
      collapsible="icon"
    >
      <SidebarContent>
        <SidebarGroup>
          {/* Brand / logo block */}
          <div
            className={`mb-5 ${open ? "px-4" : "px-2"} pt-6 transition-all duration-200 flex items-center gap-2`}
          >
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-accentSubtle text-xs font-semibold text-accent">
              SV
            </div>
            {open && (
              <div className="min-w-0">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-textSoft">
                  Sora Vault
                </div>
                <div className="text-xs text-textMuted truncate capitalize">
                  {subtitle}
                </div>
              </div>
            )}
          </div>

          {/* Nav items */}
          <SidebarMenu className="space-y-0.5 px-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.url;
              const isCollection = item.url === "/collection";

              return (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive}>
                    <button
                      onClick={() => handleNavClick(item.url)}
                      className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors ${
                        isActive
                          ? "bg-accentSubtle text-textMain font-medium"
                          : "text-textMuted hover:bg-surfaceMuted hover:text-textMain"
                      }`}
                    >
                      {isCollection && open ? (
                        <>
                          <span className="text-base leading-none w-5 text-center flex-shrink-0">
                            {collectionEmoji}
                          </span>
                          <span className="truncate">{item.title}</span>
                        </>
                      ) : isCollection ? (
                        <span className="text-base leading-none w-5 text-center flex-shrink-0">
                          {collectionEmoji}
                        </span>
                      ) : (
                        <>
                          <item.icon className="h-5 w-5 flex-shrink-0" />
                          {open && <span className="truncate">{item.title}</span>}
                        </>
                      )}
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>

          {/* Feedback */}
          {user && (
            <div className={`mt-3 ${open ? "px-2" : "px-1"}`}>
              <SubmitFeedbackDialog>
                <SidebarMenuButton
                  className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors text-textMuted hover:bg-surfaceMuted hover:text-textMain ${
                    !open ? "justify-center" : ""
                  }`}
                >
                  <Lightbulb className="h-5 w-5 flex-shrink-0" />
                  {open && <span>Feedback</span>}
                </SidebarMenuButton>
              </SubmitFeedbackDialog>
            </div>
          )}
        </SidebarGroup>
      </SidebarContent>

      {/* Footer — sign-out */}
      {user && (
        <SidebarFooter className="border-t border-sidebar-border px-4 py-3">
          {open ? (
            <div className="flex flex-col gap-1.5">
              <p className="text-xs text-sidebar-foreground/60 truncate">{user.email}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="justify-start gap-2 px-1 text-sidebar-foreground hover:text-sidebar-accent-foreground"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={signOut}
              title="Sign out"
              className="mx-auto text-sidebar-foreground hover:text-sidebar-accent-foreground"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
