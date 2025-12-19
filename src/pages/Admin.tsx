import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AllowedUsersTable } from "@/components/admin/AllowedUsersTable";
import { RegisteredUsersTable } from "@/components/admin/RegisteredUsersTable";
import { RegistrationRequestsTable } from "@/components/admin/RegistrationRequestsTable";
import { TermsAcceptancesTable } from "@/components/admin/TermsAcceptancesTable";
import { ManageCollectionsDialog } from "@/components/admin/ManageCollectionsDialog";
import { MethodologyTab } from "@/components/admin/MethodologyTab";
import { DocumentationTab } from "@/components/admin/DocumentationTab";
import { AccessLogsTab } from "@/components/admin/AccessLogsTab";
import { UsageMetricsTab } from "@/components/admin/UsageMetricsTab";
import { Shield, Users, UserCog, FileCheck, Calendar, RefreshCw, Download, Moon, Sun, BookOpen, FileText, Activity, BarChart3 } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import * as XLSX from 'xlsx';

export default function Admin() {
  const { user, isAdmin, loading } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [isUpdatingPrices, setIsUpdatingPrices] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
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

  const handleExportWearLogs = async () => {
    setIsExporting(true);
    try {
      // Fetch all wear entries with related data
      const { data: wearEntries, error: wearError } = await supabase
        .from('wear_entries')
        .select('*')
        .order('wear_date', { ascending: false });

      if (wearError) throw wearError;

      // Fetch all related data
      const { data: watches } = await supabase.from('watches').select('*');
      const { data: trips } = await supabase.from('trips').select('*');
      const { data: events } = await supabase.from('events').select('*');
      const { data: waterUsages } = await supabase.from('water_usage').select('*');
      const { data: watchSpecs } = await supabase.from('watch_specs').select('*');

      // Create a map for quick lookups
      const watchMap = new Map(watches?.map(w => [w.id, w]) || []);
      const tripMap = new Map(trips?.map(t => [t.id, t]) || []);
      const eventMap = new Map(events?.map(e => [e.id, e]) || []);
      const waterMap = new Map(waterUsages?.map(w => [w.id, w]) || []);
      const specsMap = new Map(watchSpecs?.map(s => [s.watch_id, s]) || []);

      // Flatten the data
      const exportData = wearEntries?.map(entry => {
        const watch = watchMap.get(entry.watch_id);
        const trip = entry.trip_id ? tripMap.get(entry.trip_id) : null;
        const event = entry.event_id ? eventMap.get(entry.event_id) : null;
        const water = entry.water_usage_id ? waterMap.get(entry.water_usage_id) : null;
        const specs = watch ? specsMap.get(watch.id) : null;

        return {
          // Wear Entry Info
          'Wear Date': entry.wear_date,
          'Days Worn': entry.days,
          'Wear Notes': entry.notes || '',
          
          // Watch Info
          'Watch Brand': watch?.brand || '',
          'Watch Model': watch?.model || '',
          'Watch Type': watch?.type || '',
          'Dial Color': watch?.dial_color || '',
          'Cost': watch?.cost || '',
          'MSRP': watch?.msrp || '',
          'Movement': watch?.movement || '',
          'Case Size': watch?.case_size || '',
          'Lug to Lug': watch?.lug_to_lug_size || '',
          'When Bought': watch?.when_bought || '',
          'Why Bought': watch?.why_bought || '',
          'What I Like': watch?.what_i_like || '',
          'What I Don\'t Like': watch?.what_i_dont_like || '',
          
          // Watch Specs
          'Specs Case Material': specs?.case_material || '',
          'Specs Crystal': specs?.crystal || '',
          'Specs Caseback': specs?.caseback || '',
          'Specs Band': specs?.band || '',
          'Specs Power Reserve': specs?.power_reserve || '',
          'Specs Water Resistance': specs?.water_resistance || '',
          
          // Trip Info
          'Trip Location': trip?.location || '',
          'Trip Purpose': trip?.purpose || '',
          'Trip Start Date': trip?.start_date || '',
          'Trip Days': trip?.days || '',
          'Trip Notes': trip?.notes || '',
          
          // Event Info
          'Event Location': event?.location || '',
          'Event Purpose': event?.purpose || '',
          'Event Start Date': event?.start_date || '',
          'Event Days': event?.days || '',
          
          // Water Usage Info
          'Water Activity Type': water?.activity_type || '',
          'Water Activity Date': water?.activity_date || '',
          'Water Depth (meters)': water?.depth_meters || '',
          'Water Duration (minutes)': water?.duration_minutes || '',
          'Water Notes': water?.notes || '',
        };
      }) || [];

      // Create workbook and worksheet
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Wear Logs');

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `watch_wear_logs_${timestamp}.xlsx`;

      // Download file
      XLSX.writeFile(wb, filename);

      toast.success('Wear logs exported successfully');
    } catch (error) {
      console.error('Error exporting wear logs:', error);
      toast.error('Failed to export wear logs');
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate("/");
    }
  }, [user, isAdmin, loading, navigate]);

  if (loading) {
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
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">Admin Panel</h1>
            </div>
            <p className="text-muted-foreground">
              Manage user access and view registered users
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleExportWearLogs} variant="outline" disabled={isExporting}>
              <Download className={`w-4 h-4 mr-2 ${isExporting ? 'animate-spin' : ''}`} />
              {isExporting ? 'Exporting...' : 'Export Wear Logs'}
            </Button>
            <Button onClick={handleUpdateMarketPrices} variant="outline" disabled={isUpdatingPrices}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isUpdatingPrices ? 'animate-spin' : ''}`} />
              {isUpdatingPrices ? 'Updating...' : 'Update Market Prices'}
            </Button>
            <Button onClick={goToWearLogs} variant="outline">
              <Calendar className="w-4 h-4 mr-2" />
              Wear Logs
            </Button>
            <ManageCollectionsDialog />
          </div>
        </div>

        <Tabs defaultValue="requests" className="w-full">
          <TabsList className="grid w-full max-w-5xl grid-cols-8">
            <TabsTrigger value="requests" className="flex items-center gap-1 text-xs">
              <UserCog className="h-3 w-3" />
              Requests
            </TabsTrigger>
            <TabsTrigger value="allowed" className="flex items-center gap-1 text-xs">
              <UserCog className="h-3 w-3" />
              Allowed
            </TabsTrigger>
            <TabsTrigger value="registered" className="flex items-center gap-1 text-xs">
              <Users className="h-3 w-3" />
              Users
            </TabsTrigger>
            <TabsTrigger value="acceptances" className="flex items-center gap-1 text-xs">
              <FileCheck className="h-3 w-3" />
              Terms
            </TabsTrigger>
            <TabsTrigger value="methodology" className="flex items-center gap-1 text-xs">
              <BookOpen className="h-3 w-3" />
              Methodology
            </TabsTrigger>
            <TabsTrigger value="documentation" className="flex items-center gap-1 text-xs">
              <FileText className="h-3 w-3" />
              Docs
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-1 text-xs">
              <Activity className="h-3 w-3" />
              Logs
            </TabsTrigger>
            <TabsTrigger value="metrics" className="flex items-center gap-1 text-xs">
              <BarChart3 className="h-3 w-3" />
              Metrics
            </TabsTrigger>
          </TabsList>

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

          <TabsContent value="acceptances" className="space-y-4">
            <TermsAcceptancesTable />
          </TabsContent>

          <TabsContent value="methodology" className="space-y-4">
            <MethodologyTab />
          </TabsContent>

          <TabsContent value="documentation" className="space-y-4">
            <DocumentationTab />
          </TabsContent>

          <TabsContent value="logs" className="space-y-4">
            <AccessLogsTab />
          </TabsContent>

          <TabsContent value="metrics" className="space-y-4">
            <UsageMetricsTab />
          </TabsContent>
        </Tabs>

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
