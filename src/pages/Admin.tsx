import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AllowedUsersTable } from "@/components/admin/AllowedUsersTable";
import { RegisteredUsersTable } from "@/components/admin/RegisteredUsersTable";
import { RegistrationRequestsTable } from "@/components/admin/RegistrationRequestsTable";
import { TermsAcceptancesTable } from "@/components/admin/TermsAcceptancesTable";
import { ManageCollectionsDialog } from "@/components/admin/ManageCollectionsDialog";
import { Shield, Users, UserCog, FileCheck, Calendar, RefreshCw } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Admin() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [isUpdatingPrices, setIsUpdatingPrices] = useState(false);
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
          <TabsList className="grid w-full max-w-3xl grid-cols-4">
            <TabsTrigger value="requests" className="flex items-center gap-2">
              <UserCog className="h-4 w-4" />
              Requests
            </TabsTrigger>
            <TabsTrigger value="allowed" className="flex items-center gap-2">
              <UserCog className="h-4 w-4" />
              Allowed Users
            </TabsTrigger>
            <TabsTrigger value="registered" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Registered Users
            </TabsTrigger>
            <TabsTrigger value="acceptances" className="flex items-center gap-2">
              <FileCheck className="h-4 w-4" />
              Terms Acceptances
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
        </Tabs>

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
      </div>
    </AppLayout>
  );
}
