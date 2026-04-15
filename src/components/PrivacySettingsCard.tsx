import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Shield, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function PrivacySettingsCard() {
  const { user } = useAuth();
  const [isCollectionPublic, setIsCollectionPublic] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadPreferences();
  }, [user]);

  const loadPreferences = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_preferences")
      .select("is_collection_public")
      .eq("user_id", user.id)
      .maybeSingle();

    if (data) {
      setIsCollectionPublic((data as any).is_collection_public ?? false);
    }
    setLoading(false);
  };

  const handleToggle = async (checked: boolean) => {
    if (!user) return;
    setIsCollectionPublic(checked);

    const { error } = await supabase
      .from("user_preferences")
      .upsert(
        { user_id: user.id, is_collection_public: checked, updated_at: new Date().toISOString() } as any,
        { onConflict: "user_id" }
      );

    if (error) {
      setIsCollectionPublic(!checked);
      toast.error("Failed to update privacy settings");
    } else {
      toast.success(checked ? "Collection is now public" : "Collection is now private");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Privacy
        </CardTitle>
        <CardDescription>
          Control who can see your collection
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <div>
              <Label htmlFor="public-collection" className="font-medium">Public Collection</Label>
              <p className="text-xs text-muted-foreground">Allow anyone to view your shared items</p>
            </div>
          </div>
          <Switch
            id="public-collection"
            checked={isCollectionPublic}
            onCheckedChange={handleToggle}
            disabled={loading}
          />
        </div>
      </CardContent>
    </Card>
  );
}
