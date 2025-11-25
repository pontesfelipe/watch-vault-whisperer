import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, Shield, Calendar, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAllowedUserCheck } from "@/hooks/useAllowedUserCheck";
import { differenceInDays, format, isPast } from "date-fns";

interface CollectionInsightsProps {
  watchCount: number;
  watches: any[];
}

export const CollectionInsights = ({ watchCount, watches }: CollectionInsightsProps) => {
  const [insights, setInsights] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [remainingUsage, setRemainingUsage] = useState<number | null>(null);
  const { toast } = useToast();
  const { isAllowed } = useAllowedUserCheck();

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

  // Warranty analysis
  const watchesWithWarranty = watches.filter(w => w.warranty_date);
  const watchesWithoutWarranty = watches.filter(w => !w.warranty_date);
  
  const warrantyAnalysis = watchesWithWarranty.map(watch => {
    const warrantyDate = new Date(watch.warranty_date);
    const daysRemaining = differenceInDays(warrantyDate, new Date());
    const isExpired = isPast(warrantyDate);
    const isExpiringSoon = !isExpired && daysRemaining <= 90;
    
    return {
      ...watch,
      warrantyDate,
      daysRemaining,
      isExpired,
      isExpiringSoon,
      status: isExpired ? 'Expired' : isExpiringSoon ? 'Expiring Soon' : 'Valid'
    };
  }).sort((a, b) => a.daysRemaining - b.daysRemaining);

  const expiredCount = warrantyAnalysis.filter(w => w.isExpired).length;
  const expiringSoonCount = warrantyAnalysis.filter(w => w.isExpiringSoon).length;

  if (watchCount < 3) {
    return (
      <Card className="border-borderSubtle bg-surface p-6 shadow-card">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-accent/10">
            <Sparkles className="w-6 h-6 text-accent" />
          </div>
          <div className="flex-1">
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-textMuted mb-2">About Me</h3>
            <p className="text-textMuted text-sm leading-relaxed">
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
    <Card className="border-borderSubtle bg-surface shadow-card">
      <Tabs defaultValue="about" className="w-full">
        <TabsList className="w-full justify-start border-b border-borderSubtle rounded-none bg-transparent px-6 pt-4">
          <TabsTrigger value="about" className="gap-2">
            <Sparkles className="w-4 h-4" />
            About Me
          </TabsTrigger>
          <TabsTrigger value="warranty" className="gap-2">
            <Shield className="w-4 h-4" />
            Warranty Status
          </TabsTrigger>
        </TabsList>

        <TabsContent value="about" className="p-6 mt-0">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-accent/10">
              <Sparkles className="w-6 h-6 text-accent" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-textMuted">About Me</h3>
                <div className="flex flex-col items-end gap-1">
                  {remainingUsage !== null && (
                    <span className="text-xs text-textMuted">
                      {remainingUsage} left this month
                    </span>
                  )}
                  <Button
                    onClick={handleGenerateInsights}
                    disabled={isGenerating || remainingUsage === 0}
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
              </div>
              
              {insights ? (
                <div className="prose prose-sm max-w-none text-textMuted">
                  {insights.split('\n').map((paragraph, idx) => (
                    paragraph.trim() && <p key={idx} className="mb-2">{paragraph}</p>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-textMuted">
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
        </TabsContent>

        <TabsContent value="warranty" className="p-6 mt-0">
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-surfaceMuted border border-borderSubtle">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-4 h-4 text-accent" />
                  <span className="text-xs font-medium text-textMuted uppercase tracking-wider">With Warranty</span>
                </div>
                <p className="text-2xl font-semibold text-textMain">{watchesWithWarranty.length}</p>
              </div>
              
              <div className="p-4 rounded-lg bg-surfaceMuted border border-borderSubtle">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  <span className="text-xs font-medium text-textMuted uppercase tracking-wider">Expiring Soon</span>
                </div>
                <p className="text-2xl font-semibold text-textMain">{expiringSoonCount}</p>
              </div>
              
              <div className="p-4 rounded-lg bg-surfaceMuted border border-borderSubtle">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4 text-danger" />
                  <span className="text-xs font-medium text-textMuted uppercase tracking-wider">Expired</span>
                </div>
                <p className="text-2xl font-semibold text-textMain">{expiredCount}</p>
              </div>
              
              <div className="p-4 rounded-lg bg-surfaceMuted border border-borderSubtle">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-4 h-4 text-textMuted opacity-50" />
                  <span className="text-xs font-medium text-textMuted uppercase tracking-wider">No Info</span>
                </div>
                <p className="text-2xl font-semibold text-textMain">{watchesWithoutWarranty.length}</p>
              </div>
            </div>

            {/* Watches with Warranty */}
            {warrantyAnalysis.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-textMain mb-3">Watches with Warranty</h4>
                <div className="space-y-2">
                  {warrantyAnalysis.map((watch) => (
                    <div 
                      key={watch.id}
                      className="p-4 rounded-lg border border-borderSubtle bg-surface hover:bg-surfaceMuted transition-colors"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-textMain truncate">
                            {watch.brand} {watch.model}
                          </p>
                          <p className="text-xs text-textMuted">
                            {format(watch.warrantyDate, 'MMM d, yyyy')}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className={`text-sm font-medium ${
                              watch.isExpired ? 'text-danger' : 
                              watch.isExpiringSoon ? 'text-yellow-600' : 
                              'text-green-600'
                            }`}>
                              {watch.status}
                            </p>
                            <p className="text-xs text-textMuted">
                              {watch.isExpired 
                                ? `${Math.abs(watch.daysRemaining)} days ago` 
                                : `${watch.daysRemaining} days left`
                              }
                            </p>
                          </div>
                          <div className={`w-3 h-3 rounded-full ${
                            watch.isExpired ? 'bg-danger' : 
                            watch.isExpiringSoon ? 'bg-yellow-500' : 
                            'bg-green-500'
                          }`} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Watches without Warranty */}
            {watchesWithoutWarranty.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-textMuted" />
                  <h4 className="text-sm font-semibold text-textMain">Watches Without Warranty Info</h4>
                </div>
                <div className="p-4 rounded-lg border border-borderSubtle bg-surfaceMuted">
                  <div className="space-y-2 mb-3">
                    {watchesWithoutWarranty.map((watch) => (
                      <div key={watch.id} className="flex items-center gap-2 text-sm text-textMuted">
                        <span className="w-1.5 h-1.5 rounded-full bg-textMuted opacity-50" />
                        {watch.brand} {watch.model}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-textMuted italic">
                    Consider adding warranty information for these watches to track their coverage status.
                  </p>
                </div>
              </div>
            )}

            {/* Empty State */}
            {warrantyAnalysis.length === 0 && watchesWithoutWarranty.length === 0 && (
              <div className="text-center py-8">
                <Shield className="w-12 h-12 text-textMuted opacity-50 mx-auto mb-3" />
                <p className="text-textMuted">No watches in your collection yet.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
};
