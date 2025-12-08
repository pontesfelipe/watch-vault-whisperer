import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, MapPin, Loader2 } from "lucide-react";

interface ProfileData {
  full_name: string;
  username: string;
  country: string;
  state: string;
  city: string;
}

interface PreferencesData {
  trade_match_scope: string;
}

export function ProfileSettingsCard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    full_name: "",
    username: "",
    country: "",
    state: "",
    city: "",
  });
  const [preferences, setPreferences] = useState<PreferencesData>({
    trade_match_scope: "global",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      setLoading(true);
      try {
        // Fetch profile
        const { data: profileData } = await supabase
          .from("profiles")
          .select("full_name, username, country, state, city")
          .eq("id", user.id)
          .single();

        if (profileData) {
          setProfile({
            full_name: profileData.full_name || "",
            username: profileData.username || "",
            country: profileData.country || "",
            state: profileData.state || "",
            city: profileData.city || "",
          });
        }

        // Fetch preferences
        const { data: prefsData } = await supabase
          .from("user_preferences")
          .select("trade_match_scope")
          .eq("user_id", user.id)
          .single();

        if (prefsData) {
          setPreferences({
            trade_match_scope: prefsData.trade_match_scope || "global",
          });
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: profile.full_name || null,
          username: profile.username || null,
          country: profile.country || null,
          state: profile.state || null,
          city: profile.city || null,
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      // Upsert preferences
      const { error: prefsError } = await supabase
        .from("user_preferences")
        .upsert({
          user_id: user.id,
          trade_match_scope: preferences.trade_match_scope,
        }, { onConflict: "user_id" });

      if (prefsError) throw prefsError;

      toast.success("Profile updated successfully");
    } catch (error: any) {
      console.error("Error saving profile:", error);
      if (error.code === "23505") {
        toast.error("Username is already taken");
      } else {
        toast.error("Failed to save profile");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Information
          </CardTitle>
          <CardDescription>
            Update your profile details. Username will be displayed in chats instead of your real name.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={profile.full_name}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                placeholder="Your full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username (for chat)</Label>
              <Input
                id="username"
                value={profile.username}
                onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                placeholder="Choose a username"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location
          </CardTitle>
          <CardDescription>
            Your location helps match you with nearby collectors for trades.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={profile.country}
                onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                placeholder="e.g., United States"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State/Region</Label>
              <Input
                id="state"
                value={profile.state}
                onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                placeholder="e.g., California"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={profile.city}
                onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                placeholder="e.g., San Francisco"
              />
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t">
            <Label htmlFor="trade_scope">Trade Match Preference</Label>
            <Select
              value={preferences.trade_match_scope}
              onValueChange={(value) => setPreferences({ ...preferences, trade_match_scope: value })}
            >
              <SelectTrigger id="trade_scope" className="w-full sm:w-[280px]">
                <SelectValue placeholder="Select matching scope" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="global">Global (anywhere in the world)</SelectItem>
                <SelectItem value="same_country">Same Country Only</SelectItem>
                <SelectItem value="same_state">Same State/Region Only</SelectItem>
                <SelectItem value="same_city">Same City Only</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Only receive trade match notifications from collectors in your selected area.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </div>
  );
}
