import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Sparkles, Save, Wand2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TastePreferencesProps {
  onSuggest: (description: string) => void;
  isGenerating: boolean;
  remainingUsage?: number | null;
}

export const TastePreferences = ({ onSuggest, isGenerating, remainingUsage }: TastePreferencesProps) => {
  const [tasteDescription, setTasteDescription] = useState("");
  const [saved, setSaved] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from("user_preferences")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (data?.taste_description) {
        setTasteDescription(data.taste_description);
        setSaved(true);
      }
    } catch (error) {
      console.error("Error loading preferences:", error);
    }
  };

  const handleSave = async () => {
    try {
      const { data: existing } = await supabase
        .from("user_preferences")
        .select("id")
        .limit(1)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("user_preferences")
          .update({ taste_description: tasteDescription })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_preferences")
          .insert([{ taste_description: tasteDescription }]);
        if (error) throw error;
      }

      setSaved(true);
      toast({
        title: "Preferences saved",
        description: "Your taste preferences have been saved",
      });
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast({
        title: "Error",
        description: "Failed to save preferences",
        variant: "destructive",
      });
    }
  };

  const handleAnalyzeCollection = async () => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-taste-profile");

      if (error) throw error;

      if (data?.tasteProfile) {
        setTasteDescription(data.tasteProfile);
        setSaved(false);
        toast({
          title: "Taste profile generated",
          description: "Your collection has been analyzed. Review and save the generated profile.",
        });
      } else if (data?.error) {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error("Error analyzing collection:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to analyze collection",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          Your Watch Taste Preferences
        </CardTitle>
        <CardDescription>
          Auto-generate your taste profile from your collection data or write your own description
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-end">
          <Button
            onClick={handleAnalyzeCollection}
            variant="outline"
            size="sm"
            disabled={isAnalyzing || isGenerating}
            className="gap-2"
          >
            <Wand2 className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
            {isAnalyzing ? "Analyzing..." : "Auto-Generate from Collection"}
          </Button>
        </div>
        <Textarea
          value={tasteDescription}
          onChange={(e) => {
            setTasteDescription(e.target.value);
            setSaved(false);
          }}
          placeholder="Click 'Auto-Generate from Collection' to analyze your watches, wear logs, trips, events, and personal notes - or write your own description here."
          rows={6}
          className="resize-none"
        />
        <div className="flex gap-2">
          <Button
            onClick={handleSave}
            variant="outline"
            disabled={!tasteDescription.trim() || saved}
            className="gap-2"
          >
            <Save className="w-4 h-4" />
            {saved ? "Saved" : "Save Preferences"}
          </Button>
          <Button
            onClick={() => onSuggest(tasteDescription)}
            disabled={isGenerating || !tasteDescription.trim() || remainingUsage === 0}
            className="gap-2"
          >
            <Sparkles className="w-4 h-4" />
            {isGenerating ? "Generating..." : "Generate Taste Suggestions"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};