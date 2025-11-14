import { useState } from "react";
import { Plus, Trash2, AlertCircle } from "lucide-react";
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
  const { toast } = useToast();
  const { isAllowed, loading: checkingAccess } = useAllowedUserCheck();

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
      // Fetch current watch collection to inform suggestions
      const { data: watches } = await supabase
        .from("watches")
        .select("brand, model, dial_color, type");

      const { data, error } = await supabase.functions.invoke("suggest-watches", {
        body: { 
          tasteDescription,
          collection: watches || []
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading wishlist...</p>
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
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Wishlist
          </h1>
          <p className="text-muted-foreground">
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
        <TastePreferences
          onSuggest={handleGenerateSuggestions}
          isGenerating={isGenerating}
        />
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
          <WishlistTable items={aiSuggestions} onDelete={refetch} />
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
