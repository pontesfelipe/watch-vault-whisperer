import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAllowedUserCheck } from "@/hooks/useAllowedUserCheck";

interface CollectionInsightsProps {
  watchCount: number;
  watches: any[];
}

export const CollectionInsights = ({ watchCount, watches }: CollectionInsightsProps) => {
  const [insights, setInsights] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { isAllowed } = useAllowedUserCheck();

  useEffect(() => {
    if (isAllowed) {
      loadInsights();
    }
  }, [isAllowed]);

  const loadInsights = async () => {
    try {
      const { data, error } = await supabase
        .from("collection_insights")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      if (data?.insights) {
        setInsights(data.insights);
      }
    } catch (error) {
      console.error("Error loading insights:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAllowed || isLoading) return null;

  const handleGenerateInsights = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-collection", {
        body: { watches },
      });

      if (error) throw error;

      const newInsights = data.insights;
      setInsights(newInsights);

      // Save to database
      const { data: existing } = await supabase
        .from("collection_insights")
        .select("id")
        .limit(1)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("collection_insights")
          .update({ insights: newInsights, updated_at: new Date().toISOString() })
          .eq("id", existing.id);
      } else {
        await supabase
          .from("collection_insights")
          .insert([{ insights: newInsights }]);
      }

      toast({
        title: "Insights Updated",
        description: "Your collection insights have been refreshed",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate insights",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (watchCount < 3) {
    return (
      <Card className="border-border bg-card p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-primary/10">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2 text-foreground">About Me</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              I don't know you much yet, but soon I'll be able to tell you more about your collection and taste. 
              Add at least {3 - watchCount} more {3 - watchCount === 1 ? "watch" : "watches"} to unlock AI-powered 
              insights about your preferences and collecting patterns.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card p-6">
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-lg bg-primary/10">
          <Sparkles className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-foreground">About Me</h3>
            <Button
              onClick={handleGenerateInsights}
              disabled={isGenerating}
              size="sm"
              variant="outline"
              className="gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  {insights ? "Refresh" : "Analyze"}
                </>
              )}
            </Button>
          </div>
          
          {insights ? (
            <div className="prose prose-sm max-w-none text-muted-foreground">
              {insights.split('\n').map((paragraph, idx) => (
                paragraph.trim() && <p key={idx} className="mb-2">{paragraph}</p>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Discover personalized insights about your collection and taste. AI will analyze your watches, 
                brands, styles, and preferences to give you a unique perspective on your collecting journey.
              </p>
              <Button
                onClick={handleGenerateInsights}
                disabled={isGenerating}
                size="sm"
                className="gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Analyze My Collection
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
