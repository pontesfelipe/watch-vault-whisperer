import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AllowedUsersTable } from "@/components/admin/AllowedUsersTable";
import { RegisteredUsersTable } from "@/components/admin/RegisteredUsersTable";
import { RegistrationRequestsTable } from "@/components/admin/RegistrationRequestsTable";
import { ManageCollectionsDialog } from "@/components/admin/ManageCollectionsDialog";
import { MethodologyTab } from "@/components/admin/MethodologyTab";
import { DocumentationTab } from "@/components/admin/DocumentationTab";
import { CollectionsTab } from "@/components/admin/CollectionsTab";
import { FeedbackTab } from "@/components/admin/FeedbackTab";
import { FeatureMatrixTab } from "@/components/admin/FeatureMatrixTab";
import { UserGroupsTab } from "@/components/admin/UserGroupsTab";
import { EmailDispatchPanel } from "@/components/admin/EmailDispatchPanel";
import { ExportWearLogsDialog } from "@/components/admin/ExportWearLogsDialog";
import { ExportWatchInventoryDialog } from "@/components/admin/ExportWatchInventoryDialog";
import { ExportAllDataDialog } from "@/components/admin/ExportAllDataDialog";
import { Shield, Users, UserCog, Calendar, RefreshCw, Moon, Sun, BookOpen, FileText, FolderOpen, MessageSquarePlus, ToggleRight, ShieldAlert, UsersRound, Mail, Wrench, Trash2 } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { purgeBrowserCachesAndReload } from "@/utils/cacheReset";

export default function Admin() {
  const { user, isAdmin, loading, adminChecked } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [isUpdatingPrices, setIsUpdatingPrices] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const goToWearLogs = () => navigate("/admin/wear-logs");

  const handleUpdateMarketPrices = async () => {
    setIsUpdatingPrices(true);
    try {
      const { data, error } = await supabase.functions.invoke('update-all-watch-prices');
      
      if (error) throw error;
      
      toast.success(data.message || 'Market prices updated successfully');
    } catch (error) {
      console.error('Error updating market prices:', error);
      toast.error('Failed to update market prices');
    } finally {
      setIsUpdatingPrices(false);
    }
  };

  const handlePurgeAndReload = async () => {
    if (!confirm("This will unregister service workers, clear all caches, and reload the app. Continue?")) return;
    setIsPurging(true);
    try {
      toast.success("Caches purged. Reloading…");
      setTimeout(() => {
        purgeBrowserCachesAndReload({ queryKey: "purge" });
      }, 400);
    } catch (err) {
      console.error("Purge failed:", err);
      toast.error("Failed to purge caches");
      setIsPurging(false);
    }
  };

  useEffect(() => {
    if (!loading && adminChecked && (!user || !isAdmin)) {
      navigate("/");
    }
  }, [user, isAdmin, loading, adminChecked, navigate]);

  if (loading || !adminChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">Admin Panel</h1>
            </div>
            <p className="text-muted-foreground">
              Manage user access and view registered users
            </p>
          </div>
          <div className="flex flex-wrap gap-2 lg:justify-end">
            <ExportAllDataDialog />
            <ExportWearLogsDialog />
            <ExportWatchInventoryDialog />
            <Button onClick={handleUpdateMarketPrices} variant="outline" disabled={isUpdatingPrices}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isUpdatingPrices ? 'animate-spin' : ''}`} />
              {isUpdatingPrices ? 'Updating...' : 'Update Market Prices'}
            </Button>
            <Button onClick={goToWearLogs} variant="outline">
              <Calendar className="w-4 h-4 mr-2" />
              Wear Logs
            </Button>
            <Button onClick={() => navigate("/admin/security")} variant="outline">
              <ShieldAlert className="w-4 h-4 mr-2" />
              Security
            </Button>
            <Button onClick={handlePurgeAndReload} variant="outline" disabled={isPurging}>
              <Trash2 className={`w-4 h-4 mr-2 ${isPurging ? "animate-pulse" : ""}`} />
              {isPurging ? "Purging…" : "Purge Cache & Reload"}
            </Button>
            <ManageCollectionsDialog />
          </div>
        </div>

        {/* Users section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Users</h2>
          </div>
          <Tabs defaultValue="requests" className="w-full">
            <div className="w-full overflow-x-auto scrollbar-hide -mx-2 px-2">
              <TabsList className="inline-flex w-max gap-1 h-auto p-1">
                <TabsTrigger value="requests" className="flex items-center gap-1.5 text-xs px-3 py-2 whitespace-nowrap">
                  <UserCog className="h-3.5 w-3.5" />
                  Requests
                </TabsTrigger>
                <TabsTrigger value="allowed" className="flex items-center gap-1.5 text-xs px-3 py-2 whitespace-nowrap">
                  <UserCog className="h-3.5 w-3.5" />
                  Allowed
                </TabsTrigger>
                <TabsTrigger value="registered" className="flex items-center gap-1.5 text-xs px-3 py-2 whitespace-nowrap">
                  <Users className="h-3.5 w-3.5" />
                  Registered
                </TabsTrigger>
                <TabsTrigger value="groups" className="flex items-center gap-1.5 text-xs px-3 py-2 whitespace-nowrap">
                  <UsersRound className="h-3.5 w-3.5" />
                  Groups
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="requests" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Registration Requests</CardTitle>
                  <CardDescription>
                    Review and approve user registration requests
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RegistrationRequestsTable />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="allowed" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Manage Allowed Users</CardTitle>
                  <CardDescription>
                    Add or remove email addresses that can register for the platform
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AllowedUsersTable />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="registered" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Registered Users</CardTitle>
                  <CardDescription>
                    View all users who have registered on the platform
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RegisteredUsersTable />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="groups" className="space-y-4">
              <UserGroupsTab />
            </TabsContent>
          </Tabs>
        </div>

        {/* Tools section */}
        <div className="space-y-3 pt-4 border-t">
          <div className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Tools</h2>
          </div>
          <Tabs defaultValue="email" className="w-full">
          <div className="w-full overflow-x-auto scrollbar-hide -mx-2 px-2">
          <TabsList className="inline-flex w-max gap-1 h-auto p-1">
            <TabsTrigger value="email" className="flex items-center gap-1.5 text-xs px-3 py-2 whitespace-nowrap">
              <Mail className="h-3.5 w-3.5" />
              Email
            </TabsTrigger>
            <TabsTrigger value="collections" className="flex items-center gap-1.5 text-xs px-3 py-2 whitespace-nowrap">
              <FolderOpen className="h-3.5 w-3.5" />
              Collections
            </TabsTrigger>
            <TabsTrigger value="features" className="flex items-center gap-1.5 text-xs px-3 py-2 whitespace-nowrap">
              <ToggleRight className="h-3.5 w-3.5" />
              Features
            </TabsTrigger>
            <TabsTrigger value="feedback" className="flex items-center gap-1.5 text-xs px-3 py-2 whitespace-nowrap">
              <MessageSquarePlus className="h-3.5 w-3.5" />
              Feedback
            </TabsTrigger>
            <TabsTrigger value="methodology" className="flex items-center gap-1.5 text-xs px-3 py-2 whitespace-nowrap">
              <BookOpen className="h-3.5 w-3.5" />
              Methodology
            </TabsTrigger>
            <TabsTrigger value="documentation" className="flex items-center gap-1.5 text-xs px-3 py-2 whitespace-nowrap">
              <FileText className="h-3.5 w-3.5" />
              Docs
            </TabsTrigger>
          </TabsList>
          </div>

          <TabsContent value="email" className="space-y-4">
            <EmailDispatchPanel />
          </TabsContent>

          <TabsContent value="collections" className="space-y-4">
            <CollectionsTab />
          </TabsContent>

          <TabsContent value="features" className="space-y-4">
            <FeatureMatrixTab />
          </TabsContent>

          <TabsContent value="feedback" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Feedback</CardTitle>
                <CardDescription>
                  View and manage feature suggestions and bug reports from users
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FeedbackTab />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="methodology" className="space-y-4">
            <MethodologyTab />
          </TabsContent>

          <TabsContent value="documentation" className="space-y-4">
            <DocumentationTab />
          </TabsContent>
          </Tabs>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Your Profile</CardTitle>
              <CardDescription>Administrator account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold">Email:</span>
                <span className="text-muted-foreground">{user?.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">Role:</span>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-primary text-sm">
                  <Shield className="h-3 w-3" />
                  Administrator
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>UI Theme</CardTitle>
              <CardDescription>Switch between light and dark mode</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="font-medium">Current Theme</div>
                  <div className="text-sm text-muted-foreground capitalize">{theme} mode</div>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                  className="h-10 w-10"
                >
                  {theme === "light" ? (
                    <Moon className="h-5 w-5" />
                  ) : (
                    <Sun className="h-5 w-5" />
                  )}
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                Your theme preference is saved and will persist across sessions.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
