import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface Watch {
  id: string;
  brand: string;
  model: string;
  rarity?: string | null;
  historical_significance?: string | null;
}

interface AnalyzeWatchMetadataDialogProps {
  watches: Watch[];
  onSuccess: () => void;
}

export const AnalyzeWatchMetadataDialog = ({ watches, onSuccess }: AnalyzeWatchMetadataDialogProps) => {
  const [open, setOpen] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const { toast } = useToast();

  // Filter watches that need analysis (missing rarity or historical significance)
  const watchesNeedingAnalysis = watches.filter(
    w => !w.rarity || !w.historical_significance || 
         w.rarity === 'common' || w.historical_significance === 'regular'
  );

  const analyzeWatch = async (watch: Watch) => {
    console.log(`Analyzing ${watch.brand} ${watch.model}...`);
    
    const { data, error } = await supabase.functions.invoke('analyze-watch-metadata', {
      body: { brand: watch.brand, model: watch.model }
    });

    if (error) {
      console.error(`Error analyzing ${watch.brand} ${watch.model}:`, error);
      throw error;
    }

    if (!data || !data.rarity || !data.historical_significance) {
      throw new Error('Invalid response from AI');
    }

    // Update the watch in the database
    const { error: updateError } = await supabase
      .from('watches')
      .update({
        rarity: data.rarity,
        historical_significance: data.historical_significance
      })
      .eq('id', watch.id);

    if (updateError) {
      console.error(`Error updating ${watch.brand} ${watch.model}:`, updateError);
      throw updateError;
    }

    console.log(`Updated ${watch.brand} ${watch.model}: ${data.rarity}, ${data.historical_significance}`);
    return data;
  };

  const analyzeAllWatches = async () => {
    setAnalyzing(true);
    setProgress({ current: 0, total: watchesNeedingAnalysis.length });

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < watchesNeedingAnalysis.length; i++) {
      const watch = watchesNeedingAnalysis[i];
      setProgress({ current: i + 1, total: watchesNeedingAnalysis.length });

      try {
        await analyzeWatch(watch);
        successCount++;
        
        // Add delay between requests to avoid rate limiting
        if (i < watchesNeedingAnalysis.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`Failed to analyze ${watch.brand} ${watch.model}:`, error);
        failCount++;
        
        // If we hit rate limit, stop processing
        if (error instanceof Error && error.message.includes('Rate limit')) {
          toast({
            title: "Rate Limit Reached",
            description: `Analyzed ${successCount} watches. Please wait a moment before continuing.`,
            variant: "destructive",
          });
          break;
        }
      }
    }

    setAnalyzing(false);
    
    if (successCount > 0) {
      toast({
        title: "Analysis Complete",
        description: `Successfully analyzed ${successCount} watch${successCount > 1 ? 'es' : ''}${failCount > 0 ? `. ${failCount} failed.` : '.'}`,
      });
      onSuccess();
      setOpen(false);
    } else {
      toast({
        title: "Analysis Failed",
        description: "No watches were successfully analyzed. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getRarityColor = (rarity: string | null) => {
    if (!rarity) return "bg-muted";
    const colors: Record<string, string> = {
      common: "bg-slate-500",
      uncommon: "bg-green-500",
      rare: "bg-blue-500",
      very_rare: "bg-purple-500",
      grail: "bg-amber-500",
    };
    return colors[rarity] || "bg-muted";
  };

  const getHistoricalColor = (significance: string | null) => {
    if (!significance) return "bg-muted";
    const colors: Record<string, string> = {
      regular: "bg-slate-500",
      notable: "bg-blue-500",
      historically_significant: "bg-amber-500",
    };
    return colors[significance] || "bg-muted";
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Sparkles className="w-4 h-4" />
          AI Analyze Metadata
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI Watch Metadata Analysis
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Use AI to analyze your watches and automatically determine their rarity and historical significance 
            based on production numbers, market availability, and historical context.
          </p>

          {watchesNeedingAnalysis.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">All watches have been analyzed!</p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Watches to analyze:</span>
                  <Badge variant="secondary">{watchesNeedingAnalysis.length}</Badge>
                </div>
                
                <div className="max-h-60 overflow-y-auto space-y-2 border border-border rounded-lg p-3">
                  {watchesNeedingAnalysis.map(watch => (
                    <div key={watch.id} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded">
                      <span className="font-medium">
                        {watch.brand} {watch.model}
                      </span>
                      <div className="flex gap-2">
                        {watch.rarity && (
                          <Badge className={getRarityColor(watch.rarity)} variant="secondary">
                            {watch.rarity.replace('_', ' ')}
                          </Badge>
                        )}
                        {watch.historical_significance && (
                          <Badge className={getHistoricalColor(watch.historical_significance)} variant="secondary">
                            {watch.historical_significance.replace('_', ' ')}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {analyzing && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Analyzing...</span>
                    <span className="text-muted-foreground">
                      {progress.current} of {progress.total}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(progress.current / progress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button 
                  onClick={analyzeAllWatches} 
                  disabled={analyzing}
                  className="flex-1 gap-2"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Analyze All
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={analyzing}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <p>• AI analyzes production numbers, market availability, and historical context</p>
                <p>• Processing includes a 1-second delay between watches to avoid rate limits</p>
                <p>• Results are automatically saved to your collection</p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
