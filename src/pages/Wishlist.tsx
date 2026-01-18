import { useState, useEffect } from "react";
import { Plus, Trash2, AlertCircle, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { WishlistTable } from "@/components/WishlistTable";
import { TastePreferences } from "@/components/TastePreferences";
import { AddWishlistDialog } from "@/components/AddWishlistDialog";
import { useWishlistData } from "@/hooks/useWishlistData";
import { useAllowedUserCheck } from "@/hooks/useAllowedUserCheck";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Wishlist = () => {
  const { wishlist, loading, refetch } = useWishlistData();
  const [showAddWishlist, setShowAddWishlist] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [gapSuggestions, setGapSuggestions] = useState<any[]>([]);
  const [watchCount, setWatchCount] = useState(0);
  const [remainingWishlistUsage, setRemainingWishlistUsage] = useState<number | null>(null);
  const [remainingGapUsage, setRemainingGapUsage] = useState<number | null>(null);
  const { toast } = useToast();
  const { isAllowed, loading: checkingAccess } = useAllowedUserCheck();

  useEffect(() => {
    fetchWatchCount();
    if (isAllowed) {
      checkUsageLimits();
    }
  }, [isAllowed]);

  useEffect(() => {
    if (isAllowed && !loading && watchCount >= 3) {
      loadGapSuggestions();
    }
  }, [isAllowed, loading, watchCount]);

  const loadGapSuggestions = async () => {
    try {
      const { data, error } = await supabase
        .from("collection_gap_suggestions")
        .select("*")
        .order('rank', { ascending: true })
        .limit(3);

      if (error) throw error;

      if (data && data.length > 0) {
        console.log("Loaded saved gap suggestions");
        setGapSuggestions(data);
      } else {
        console.log("No saved gap suggestions, generating new ones");
        handleGenerateGapSuggestions();
      }
    } catch (error) {
      console.error("Error loading gap suggestions:", error);
    }
  };

  const fetchWatchCount = async () => {
    try {
      const { count } = await supabase
        .from("watches")
        .select("*", { count: "exact", head: true });
      
      setWatchCount(count || 0);
    } catch (error) {
      console.error("Error fetching watch count:", error);
    }
  };

  const checkUsageLimits = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check wishlist usage
      const { data: wishlistData, error: wishlistError } = await supabase.rpc('get_ai_feature_usage', {
        _user_id: user.id,
        _feature_name: 'wishlist'
      });

      if (!wishlistError && wishlistData && wishlistData.length > 0) {
        setRemainingWishlistUsage(Number(wishlistData[0].remaining_count));
      }

      // Check gap analysis usage
      const { data: gapData, error: gapError } = await supabase.rpc('get_ai_feature_usage', {
        _user_id: user.id,
        _feature_name: 'gap_analysis'
      });

      if (!gapError && gapData && gapData.length > 0) {
        setRemainingGapUsage(Number(gapData[0].remaining_count));
      }
    } catch (error) {
      console.error("Error checking usage limits:", error);
    }
  };

  const handleGenerateGapSuggestions = async () => {
    if (watchCount < 3) return;

    setIsGenerating(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Check if user can use this feature
      const { data: canUse, error: canUseError } = await supabase.rpc('can_use_ai_feature', {
        _user_id: user.id,
        _feature_name: 'gap_analysis'
      });

      if (canUseError) throw canUseError;
      if (!canUse) {
        toast({
          title: "Monthly Limit Reached",
          description: "You've used all 4 gap analyses this month. Resets next month.",
          variant: "destructive",
        });
        return;
      }

      // Fetch current watch collection to inform suggestions
      const { data: watches } = await supabase
        .from("watches")
        .select("brand, model, dial_color, type, cost");

      const { data, error } = await supabase.functions.invoke("suggest-watches", {
        body: { 
          tasteDescription: "Analyze my collection and suggest watches to fill gaps",
          collection: watches || [],
          focusOnGaps: true
        },
      });

      if (error) throw error;

      const suggestions = (data.suggestions || []).slice(0, 3);
      setGapSuggestions(suggestions);

      // Clear old gap suggestions and save new ones
      await supabase
        .from("collection_gap_suggestions")
        .delete()
        .eq('user_id', user.id);

      if (suggestions.length > 0) {
        const { error: insertError } = await supabase
          .from("collection_gap_suggestions")
          .insert(
            suggestions.map((s: any, idx: number) => ({
              user_id: user.id,
              brand: s.brand,
              model: s.model,
              dial_colors: s.dialColors || s.dial_colors || "",
              rank: s.rank || idx + 1,
              notes: s.reason || s.notes || ""
            }))
          );

        if (insertError) {
          console.error("Error saving gap suggestions:", insertError);
          throw insertError;
        }
        
        console.log("Gap suggestions saved to database");
      }

      // Record usage
      await supabase
        .from("ai_feature_usage")
        .insert([{
          user_id: user.id,
          feature_name: 'gap_analysis'
        }]);

      // Update remaining usage
      await checkUsageLimits();
    } catch (error: any) {
      console.error("Error generating gap suggestions:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate gap suggestions",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateSuggestions = async (tasteDescription: string) => {
    if (!isAllowed) {
      toast({
        title: "Access Required",
        description: "You need to be an approved user to use AI features",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Check if user can use this feature
      const { data: canUse, error: canUseError } = await supabase.rpc('can_use_ai_feature', {
        _user_id: user.id,
        _feature_name: 'wishlist'
      });

      if (canUseError) throw canUseError;
      if (!canUse) {
        toast({
          title: "Monthly Limit Reached",
          description: "You've used all 4 wishlist generations this month. Resets next month.",
          variant: "destructive",
        });
        return;
      }

      // Fetch current watch collection to inform suggestions
      const { data: watches } = await supabase
        .from("watches")
        .select("brand, model, dial_color, type, cost");

      const { data, error } = await supabase.functions.invoke("suggest-watches", {
        body: { 
          tasteDescription,
          collection: watches || [],
          focusOnGaps: false
        },
      });

      if (error) throw error;

      await supabase.from("wishlist").delete().eq("is_ai_suggested", true);

      const suggestions = data.suggestions.map((s: any, idx: number) => ({
        brand: s.brand,
        model: s.model,
        dial_colors: s.dialColors || "",
        rank: idx + 100,
        notes: s.reason,
        is_ai_suggested: true,
      }));

      const { error: insertError } = await supabase
        .from("wishlist")
        .insert(suggestions);

      if (insertError) throw insertError;

      // Record usage
      await supabase
        .from("ai_feature_usage")
        .insert([{
          user_id: user.id,
          feature_name: 'wishlist'
        }]);

      // Update remaining usage
      await checkUsageLimits();

      toast({
        title: "AI Suggestions Generated",
        description: `${suggestions.length} watches added to your wishlist`,
      });

      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClearAISuggestions = async () => {
    try {
      const { error } = await supabase
        .from("wishlist")
        .delete()
        .eq("is_ai_suggested", true);

      if (error) throw error;

      toast({
        title: "AI Suggestions Cleared",
        description: "All AI-generated suggestions have been removed",
      });

      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading || checkingAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
          <p className="mt-4 text-textMuted">Loading wishlist...</p>
        </div>
      </div>
    );
  }

  const userWishlist = wishlist.filter((item) => !item.is_ai_suggested);
  const aiSuggestions = wishlist.filter((item) => item.is_ai_suggested);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl md:text-4xl font-semibold text-textMain">
            Wishlist
          </h1>
          <p className="text-sm text-textMuted mt-1">
            Track watches you want to acquire
          </p>
        </div>
        <Button onClick={() => setShowAddWishlist(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add to Wishlist
        </Button>
      </div>

      {!isAllowed && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            AI wishlist features are only available to approved users. Please contact an administrator to request access.
          </AlertDescription>
        </Alert>
      )}

      {isAllowed && (
        <>
          <TastePreferences
            onSuggest={handleGenerateSuggestions}
            isGenerating={isGenerating}
            remainingUsage={remainingWishlistUsage}
          />
          {remainingWishlistUsage !== null && (
            <p className="text-xs text-muted-foreground text-center -mt-4">
              {remainingWishlistUsage} wishlist generations remaining this month
            </p>
          )}
        </>
      )}

      {isAllowed && watchCount >= 3 && (
        <Card className="border-border bg-card p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Collection Gap Analysis</h2>
              <p className="text-sm text-muted-foreground mt-1">
                AI-powered suggestions to complement and complete your collection
              </p>
              {remainingGapUsage !== null && (
                <p className="text-xs text-muted-foreground mt-1">
                  {remainingGapUsage} analyses remaining this month
                </p>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateGapSuggestions}
              disabled={isGenerating || remainingGapUsage === 0}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              Refresh Analysis
            </Button>
          </div>
          {isGenerating && gapSuggestions.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-sm text-muted-foreground">Analyzing your collection...</p>
              </div>
            </div>
          ) : gapSuggestions.length > 0 ? (
            <WishlistTable items={gapSuggestions.map((s, idx) => ({
              id: s.id || `gap-${idx}`,
              brand: s.brand,
              model: s.model,
              dial_colors: s.dial_colors || s.dialColors || "",
              rank: s.rank || idx + 1,
              notes: s.notes || s.reason || "",
              is_ai_suggested: true
            }))} onDelete={handleGenerateGapSuggestions} showDeleteButton={false} showAISuggested />
          ) : (
            <p className="text-sm text-muted-foreground py-4">
              No gap analysis available yet. Click refresh to analyze your collection.
            </p>
          )}
        </Card>
      )}

      {isAllowed && watchCount < 3 && (
        <Card className="border-border bg-card p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold mb-2 text-foreground">Collection Gap Analysis</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Add at least {3 - watchCount} more {3 - watchCount === 1 ? "item" : "items"} to your collection 
                to unlock AI-powered gap analysis. I'll help you identify what would complement 
                and complete your collection.
              </p>
            </div>
          </div>
        </Card>
      )}

      <Card className="border-border bg-card p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-foreground">Your Wishlist</h2>
        </div>
        <WishlistTable items={userWishlist} onDelete={refetch} />
      </Card>

      {aiSuggestions.length > 0 && (
        <Card className="border-border bg-card p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-foreground">
              AI Suggestions
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAISuggestions}
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Clear All
            </Button>
          </div>
          <WishlistTable items={aiSuggestions} onDelete={refetch} showAISuggested />
        </Card>
      )}

      <AddWishlistDialog 
        open={showAddWishlist} 
        onOpenChange={setShowAddWishlist}
        onSuccess={refetch} 
      />
    </div>
  );
};

export default Wishlist;
