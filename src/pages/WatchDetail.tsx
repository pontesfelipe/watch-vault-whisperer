import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Calendar, DollarSign, Eye, EyeOff, Trash2 } from "lucide-react";
import { AddWearDialog } from "@/components/AddWearDialog";
import { useToast } from "@/hooks/use-toast";
import { usePasscode } from "@/contexts/PasscodeContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Watch {
  id: string;
  brand: string;
  model: string;
  dial_color: string;
  type: string;
  cost: number;
}

interface WearEntry {
  id: string;
  wear_date: string;
  days: number;
  notes: string | null;
}

const WatchDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { requestVerification } = usePasscode();
  const [watch, setWatch] = useState<Watch | null>(null);
  const [wearEntries, setWearEntries] = useState<WearEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCost, setShowCost] = useState(false);

  const handleToggleCost = () => {
    if (!showCost) {
      requestVerification(() => {
        setShowCost(true);
      });
    } else {
      setShowCost(false);
    }
  };

  const fetchData = async () => {
    if (!id) return;

    const [watchResult, wearResult] = await Promise.all([
      supabase.from("watches").select("*").eq("id", id).single(),
      supabase.from("wear_entries").select("*").eq("watch_id", id).order("wear_date", { ascending: false }),
    ]);

    if (watchResult.data) setWatch(watchResult.data);
    if (wearResult.data) setWearEntries(wearResult.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleDeleteEntry = async (entryId: string) => {
    requestVerification(async () => {
      const { error } = await supabase.from("wear_entries").delete().eq("id", entryId);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to delete entry",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Wear entry deleted",
      });

      fetchData();
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!watch) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Watch not found</p>
          <Button onClick={() => navigate("/")}>Go Back</Button>
        </div>
      </div>
    );
  }

  const totalDays = wearEntries.reduce((sum, entry) => sum + parseFloat(entry.days.toString()), 0);
  const costPerUse = totalDays > 0 ? watch.cost / totalDays : watch.cost;

  // Group by month for monthly breakdown
  const monthlyData: Record<string, number> = {};
  wearEntries.forEach(entry => {
    const monthKey = new Date(entry.wear_date).toLocaleString('default', { month: 'short', year: 'numeric' });
    monthlyData[monthKey] = (monthlyData[monthKey] || 0) + parseFloat(entry.days.toString());
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-6">
          <Button variant="ghost" onClick={() => navigate("/")} className="mb-4 gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Collection
          </Button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">{watch.brand}</h1>
              <p className="text-xl text-muted-foreground">{watch.model}</p>
            </div>
            <Badge variant="secondary" className="text-sm">
              {watch.type}
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="specs" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-8">
            <TabsTrigger value="specs">Specifications</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
            <TabsTrigger value="history">Wear History</TabsTrigger>
          </TabsList>

          {/* Specifications Tab */}
          <TabsContent value="specs">
            <Card className="border-border bg-card p-6">
              <h2 className="text-xl font-semibold text-foreground mb-6">Watch Specifications</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Brand</p>
                    <p className="text-lg font-medium text-foreground">{watch.brand}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Model</p>
                    <p className="text-lg font-medium text-foreground">{watch.model}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Dial Color</p>
                    <p className="text-lg font-medium text-foreground">{watch.dial_color}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Type</p>
                    <p className="text-lg font-medium text-foreground">{watch.type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Purchase Cost</p>
                    <div className="flex items-center gap-2">
                      {showCost ? (
                        <p className="text-lg font-medium text-foreground">${watch.cost.toLocaleString()}</p>
                      ) : (
                        <p className="text-lg font-medium text-muted-foreground">••••••</p>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={handleToggleCost}
                      >
                        {showCost ? (
                          <EyeOff className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <Eye className="w-4 h-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Wear Entries</p>
                    <p className="text-lg font-medium text-foreground">{wearEntries.length}</p>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Statistics Tab */}
          <TabsContent value="stats">
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-border bg-card p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Total Days Worn</p>
                      <p className="text-3xl font-bold text-primary">{totalDays}</p>
                    </div>
                    <Calendar className="w-8 h-8 text-primary" />
                  </div>
                </Card>

                <Card className="border-border bg-card p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-1">Purchase Cost</p>
                      <div className="flex items-center gap-2">
                        {showCost ? (
                          <p className="text-3xl font-bold text-foreground">${watch.cost.toLocaleString()}</p>
                        ) : (
                          <p className="text-3xl font-bold text-muted-foreground">••••••</p>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={handleToggleCost}
                        >
                          {showCost ? (
                            <EyeOff className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <Eye className="w-4 h-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <DollarSign className="w-8 h-8 text-primary" />
                  </div>
                </Card>

                <Card className="border-border bg-card p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Cost Per Day</p>
                      {showCost ? (
                        <p className="text-3xl font-bold text-primary">${costPerUse.toFixed(0)}</p>
                      ) : (
                        <p className="text-3xl font-bold text-muted-foreground">••••</p>
                      )}
                    </div>
                    <DollarSign className="w-8 h-8 text-muted-foreground" />
                  </div>
                </Card>
              </div>

              {/* Monthly Breakdown */}
              <Card className="border-border bg-card p-6">
                <h2 className="text-xl font-semibold text-foreground mb-4">Monthly Breakdown</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(monthlyData).map(([month, days]) => (
                    <div key={month} className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">{month}</p>
                      <p className="text-2xl font-bold text-primary">{days}</p>
                      <p className="text-xs text-muted-foreground">days</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Wear History Tab */}
          <TabsContent value="history">
            <Card className="border-border bg-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-foreground">Wear History</h2>
                <AddWearDialog watchId={watch.id} onSuccess={fetchData} />
              </div>

              {wearEntries.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No wear entries yet. Add your first one above!</p>
              ) : (
                <div className="space-y-3">
                  {wearEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-4 bg-muted rounded-lg hover:bg-muted/70 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-foreground">
                          {new Date(entry.wear_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {entry.days} {entry.days === 1 ? 'day' : 'days'}
                        </p>
                        {entry.notes && (
                          <p className="text-sm text-muted-foreground mt-1">{entry.notes}</p>
                        )}
                      </div>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="hover:bg-destructive hover:text-destructive-foreground">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-card border-border">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-foreground">Delete Entry</AlertDialogTitle>
                            <AlertDialogDescription className="text-muted-foreground">
                              Are you sure you want to delete this wear entry?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteEntry(entry.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default WatchDetail;
