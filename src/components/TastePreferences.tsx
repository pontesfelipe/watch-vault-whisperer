import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Sparkles, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TastePreferencesProps {
  onSuggest: (description: string) => void;
  isGenerating: boolean;
}

export const TastePreferences = ({ onSuggest, isGenerating }: TastePreferencesProps) => {
  const [tasteDescription, setTasteDescription] = useState("");
  const [saved, setSaved] = useState(false);
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          Your Watch Taste Preferences
        </CardTitle>
        <CardDescription>
          Describe your watch preferences to get AI-powered suggestions tailored to your taste
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          value={tasteDescription}
          onChange={(e) => {
            setTasteDescription(e.target.value);
            setSaved(false);
          }}
          placeholder="Example: I love classic dress watches with leather straps, prefer smaller case sizes (36-40mm), and gravitate towards blue or silver dials. I appreciate vintage-inspired designs and Swiss movements. My budget is typically in the $2,000-$10,000 range."
          rows={5}
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
            disabled={isGenerating || !tasteDescription.trim()}
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