import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TermsAcceptancesTable } from "@/components/admin/TermsAcceptancesTable";
import { AccessLogsTab } from "@/components/admin/AccessLogsTab";
import { UsageMetricsTab } from "@/components/admin/UsageMetricsTab";
import { SecurityTab } from "@/components/admin/SecurityTab";
import { PerformanceMetricsPanel } from "@/components/PerformanceMetricsPanel";
import { ShieldAlert, ArrowLeft, Activity, BarChart3, FileCheck, ShieldCheck, Gauge } from "lucide-react";

export default function AdminSecurity() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

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

  if (!isAdmin) return null;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlert className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">Security &amp; Compliance</h1>
            </div>
            <p className="text-muted-foreground">
              Audit logs, usage metrics, terms acceptance, and security findings
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate("/admin")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Admin
          </Button>
        </div>

        <Tabs defaultValue="security" className="w-full">
          <div className="w-full overflow-x-auto scrollbar-hide -mx-2 px-2">
            <TabsList className="inline-flex w-max gap-1 h-auto p-1">
              <TabsTrigger value="security" className="flex items-center gap-1.5 text-xs px-3 py-2 whitespace-nowrap">
                <ShieldCheck className="h-3.5 w-3.5" />
                Security
              </TabsTrigger>
              <TabsTrigger value="logs" className="flex items-center gap-1.5 text-xs px-3 py-2 whitespace-nowrap">
                <Activity className="h-3.5 w-3.5" />
                Access Logs
              </TabsTrigger>
              <TabsTrigger value="metrics" className="flex items-center gap-1.5 text-xs px-3 py-2 whitespace-nowrap">
                <BarChart3 className="h-3.5 w-3.5" />
                Usage Metrics
              </TabsTrigger>
              <TabsTrigger value="acceptances" className="flex items-center gap-1.5 text-xs px-3 py-2 whitespace-nowrap">
                <FileCheck className="h-3.5 w-3.5" />
                Terms
              </TabsTrigger>
              <TabsTrigger value="performance" className="flex items-center gap-1.5 text-xs px-3 py-2 whitespace-nowrap">
                <Gauge className="h-3.5 w-3.5" />
                Performance
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="security" className="space-y-4">
            <SecurityTab />
          </TabsContent>

          <TabsContent value="logs" className="space-y-4">
            <AccessLogsTab />
          </TabsContent>

          <TabsContent value="metrics" className="space-y-4">
            <UsageMetricsTab />
          </TabsContent>

          <TabsContent value="acceptances" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Terms &amp; Privacy Acceptances</CardTitle>
                <CardDescription>
                  Track which users accepted terms and privacy policies
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TermsAcceptancesTable />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <PerformanceMetricsPanel />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}