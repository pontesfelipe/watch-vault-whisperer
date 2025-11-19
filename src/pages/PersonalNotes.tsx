import { useState, useEffect } from "react";
import { usePasscode } from "@/contexts/PasscodeContext";
import { useCollection } from "@/contexts/CollectionContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Lock, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { EditPersonalNotesDialog } from "@/components/EditPersonalNotesDialog";
import { PersonalNotesTable } from "@/components/PersonalNotesTable";
import { PurchaseTimelineTab } from "@/components/PurchaseTimelineTab";
import { SpendingAnalyticsTab } from "@/components/SpendingAnalyticsTab";

interface Watch {
  id: string;
  brand: string;
  model: string;
  cost: number;
  why_bought?: string;
  when_bought?: string;
  what_i_like?: string;
  what_i_dont_like?: string;
  created_at: string;
  sentiment?: string;
  sentiment_analyzed_at?: string;
}

export default function PersonalNotes() {
  const { isVerified, requestVerification } = usePasscode();
  const { selectedCollectionId } = useCollection();
  const [watches, setWatches] = useState<Watch[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingWatch, setEditingWatch] = useState<Watch | null>(null);
  const [analyzingSentiment, setAnalyzingSentiment] = useState(false);

  const fetchWatches = async () => {
    if (!selectedCollectionId) {
      setWatches([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("watches")
        .select("id, brand, model, cost, why_bought, when_bought, what_i_like, what_i_dont_like, created_at, sentiment, sentiment_analyzed_at")
        .eq("collection_id", selectedCollectionId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setWatches((data as any) || []);
    } catch (error) {
      console.error("Error fetching watches:", error);
      toast.error("Failed to load watches");
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeSentiment = async () => {
    setAnalyzingSentiment(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const watch of watches) {
        const notes = [
          watch.why_bought,
          watch.what_i_like,
          watch.what_i_dont_like
        ].filter(Boolean).join('\n\n');

        if (!notes.trim()) {
          console.log(`Skipping ${watch.brand} ${watch.model} - no notes`);
          continue;
        }

        try {
          const { error } = await supabase.functions.invoke('analyze-sentiment', {
            body: { watchId: watch.id, notes }
          });

          if (error) throw error;
          successCount++;
        } catch (err) {
          console.error(`Error analyzing ${watch.brand} ${watch.model}:`, err);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Analyzed sentiment for ${successCount} watch${successCount > 1 ? 'es' : ''}`);
        await fetchWatches();
      }
      
      if (errorCount > 0) {
        toast.error(`Failed to analyze ${errorCount} watch${errorCount > 1 ? 'es' : ''}`);
      }
    } catch (error) {
      console.error("Error analyzing sentiment:", error);
      toast.error("Failed to analyze sentiment");
    } finally {
      setAnalyzingSentiment(false);
    }
  };

  useEffect(() => {
    if (isVerified && selectedCollectionId) {
      fetchWatches();
    }
  }, [isVerified, selectedCollectionId]);

  const handleUnlock = () => {
    requestVerification(() => {
      fetchWatches();
    });
  };

  if (!isVerified) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Lock className="h-12 w-12 text-muted-foreground" />
            </div>
            <CardTitle>Protected Content</CardTitle>
            <CardDescription>
              This section contains personal notes about your watches. Enter the passcode to access.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={handleUnlock}>
              <Lock className="mr-2 h-4 w-4" />
              Unlock
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Collection Insights</CardTitle>
              <CardDescription>
                Your private thoughts, memories, and spending analytics
              </CardDescription>
            </div>
            {!loading && watches.length > 0 && (
              <Button
                onClick={handleAnalyzeSentiment}
                disabled={analyzingSentiment}
                variant="outline"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${analyzingSentiment ? 'animate-spin' : ''}`} />
                {analyzingSentiment ? 'Analyzing...' : 'Analyze Sentiment'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : watches.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No watches found</div>
          ) : (
            <Tabs defaultValue="notes" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="notes">Personal Notes</TabsTrigger>
                <TabsTrigger value="timeline">Purchase Timeline</TabsTrigger>
                <TabsTrigger value="analytics">Spending Analytics</TabsTrigger>
              </TabsList>
              
              <TabsContent value="notes" className="mt-6">
                <PersonalNotesTable 
                  watches={watches} 
                  onEdit={setEditingWatch}
                />
              </TabsContent>
              
              <TabsContent value="timeline" className="mt-6">
                <PurchaseTimelineTab watches={watches} />
              </TabsContent>
              
              <TabsContent value="analytics" className="mt-6">
                <SpendingAnalyticsTab watches={watches} />
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {editingWatch && (
        <EditPersonalNotesDialog
          watch={editingWatch}
          onSuccess={() => {
            fetchWatches();
            setEditingWatch(null);
          }}
          onClose={() => setEditingWatch(null)}
        />
      )}
    </div>
  );
}
