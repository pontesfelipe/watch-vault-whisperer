import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAllowedUserCheck } from "@/hooks/useAllowedUserCheck";
import { useCollection } from "@/contexts/CollectionContext";
import { getItemLabel } from "@/types/collection";

interface CollectionInsightsProps {
  watchCount: number; // Kept as watchCount for backward compatibility, but represents itemCount
  watches: any[]; // Kept as watches for backward compatibility, but represents items
}

export const CollectionInsights = ({ watchCount, watches }: CollectionInsightsProps) => {
  const [insights, setInsights] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [remainingUsage, setRemainingUsage] = useState<number | null>(null);
  const { toast } = useToast();
  const { isAllowed } = useAllowedUserCheck();
  const { currentCollectionType } = useCollection();
  
  const itemLabel = currentCollectionType ? getItemLabel(currentCollectionType, watchCount !== 1) : 'items';

  useEffect(() => {
    if (isAllowed) {
      loadInsights();
      checkUsageLimit();
    }
  }, [isAllowed]);

  const checkUsageLimit = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.rpc('get_ai_feature_usage', {
        _user_id: user.id,
        _feature_name: 'about_me'
      });

      if (error) throw error;
      if (data && data.length > 0) {
        setRemainingUsage(Number(data[0].remaining_count));
      }
    } catch (error) {
      console.error("Error checking usage limit:", error);
    }
  };

  const loadInsights = async () => {
    try {
      const { data, error } = await supabase
        .from("collection_insights")
        .select("*")
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Error loading insights:", error);
        return;
      }
      
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data: canUse, error: canUseError } = await supabase.rpc('can_use_ai_feature', {
        _user_id: user.id,
        _feature_name: 'about_me'
      });

      if (canUseError) throw canUseError;
      if (!canUse) {
        toast({
          title: "Monthly Limit Reached",
          description: "You've used all 4 'About Me' analyses this month. Resets next month.",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke("analyze-collection", {
        body: { watches },
      });

      if (error) throw error;

      const newInsights = data.insights;
      setInsights(newInsights);

      const { data: existing } = await supabase
        .from("collection_insights")
        .select("id")
        .limit(1)
        .maybeSingle();

      if (existing) {
        const { error: updateError } = await supabase
          .from("collection_insights")
          .update({ insights: newInsights, updated_at: new Date().toISOString() })
          .eq("id", existing.id);
        
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("collection_insights")
          .insert([{ 
            insights: newInsights,
            user_id: user.id
          }]);
        
        if (insertError) throw insertError;
      }

      await supabase
        .from("ai_feature_usage")
        .insert([{
          user_id: user.id,
          feature_name: 'about_me'
        }]);

      await checkUsageLimit();

      toast({
        title: "Insights Updated",
        description: "Your collection insights have been refreshed and saved",
      });
    } catch (error: any) {
      console.error("Error generating insights:", error);
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
    const remaining = 3 - watchCount;
    const remainingLabel = currentCollectionType ? getItemLabel(currentCollectionType, remaining !== 1) : 'items';
    
    return (
      <Card className="border-borderSubtle bg-surface p-6 shadow-card">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-accent/10">
            <Sparkles className="w-6 h-6 text-accent" />
          </div>
          <div className="flex-1">
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-textMuted mb-2">About My Collection</h3>
            <p className="text-textMuted text-sm leading-relaxed">
              I don't know you much yet, but soon I'll be able to tell you more about your collection and taste.
              Add at least {remaining} more {remainingLabel.toLowerCase()} to unlock AI-powered 
              insights about your preferences and collecting patterns.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="border-borderSubtle bg-surface p-4 sm:p-6 shadow-card">
      <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
        <div className="p-3 rounded-xl bg-accent/10 self-start shrink-0">
          <Sparkles className="w-6 h-6 text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-textMuted">About My Collection</h3>
            <div className="flex items-center gap-2 sm:flex-col sm:items-end sm:gap-1">
              {remainingUsage !== null && (
                <span className="text-xs text-textMuted whitespace-nowrap">
                  {remainingUsage} left this month
                </span>
              )}
              <Button
                onClick={handleGenerateInsights}
                disabled={isGenerating || remainingUsage === 0}
                size="sm"
                variant="outline"
                className="gap-2 shrink-0"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="hidden xs:inline">Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    {insights ? "Refresh" : "Analyze"}
                  </>
                )}
              </Button>
            </div>
          </div>
          
          {insights ? (
            <div className="text-textMuted text-sm leading-relaxed break-words">
              {insights.split('\n').map((paragraph, idx) => (
                paragraph.trim() && <p key={idx} className="mb-2 last:mb-0">{paragraph}</p>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-textMuted leading-relaxed">
                Discover personalized insights about your collection and taste. AI will analyze your {itemLabel.toLowerCase()}, 
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