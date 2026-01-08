import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, MapPin, Loader2, Upload, X, Palette } from "lucide-react";
import { UserAvatar, AVATAR_COLORS } from "@/components/UserAvatar";
import { cn } from "@/lib/utils";

interface ProfileData {
  full_name: string;
  username: string;
  country: string;
  state: string;
  city: string;
  avatar_url: string | null;
  avatar_color: string | null;
}

interface PreferencesData {
  trade_match_scope: string;
}

export function ProfileSettingsCard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<ProfileData>({
    full_name: "",
    username: "",
    country: "",
    state: "",
    city: "",
    avatar_url: null,
    avatar_color: null,
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
          .select("full_name, username, country, state, city, avatar_url, avatar_color")
          .eq("id", user.id)
          .single();

        if (profileData) {
          setProfile({
            full_name: profileData.full_name || "",
            username: profileData.username || "",
            country: profileData.country || "",
            state: profileData.state || "",
            city: profileData.city || "",
            avatar_url: profileData.avatar_url,
            avatar_color: profileData.avatar_color,
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

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be less than 2MB");
      return;
    }

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL with cache-busting
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const avatarUrlWithTimestamp = `${publicUrl}?t=${Date.now()}`;

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: avatarUrlWithTimestamp })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setProfile({ ...profile, avatar_url: avatarUrlWithTimestamp });
      toast.success("Avatar uploaded successfully");
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("Failed to upload avatar");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user) return;

    try {
      // Update profile to remove avatar URL
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: null })
        .eq("id", user.id);

      if (error) throw error;

      setProfile({ ...profile, avatar_url: null });
      toast.success("Avatar removed");
    } catch (error) {
      console.error("Error removing avatar:", error);
      toast.error("Failed to remove avatar");
    }
  };

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
          avatar_color: profile.avatar_color,
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
      {/* Avatar Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Avatar
          </CardTitle>
          <CardDescription>
            Customize your avatar with a photo or choose a color for your initials.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Preview */}
          <div className="flex items-center gap-4">
            <UserAvatar
              username={profile.username}
              fullName={profile.full_name}
              avatarUrl={profile.avatar_url}
              avatarColor={profile.avatar_color}
              size="lg"
              className="h-16 w-16 text-xl"
            />
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                >
                  {uploadingAvatar ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  Upload Photo
                </Button>
                {profile.avatar_url && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveAvatar}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                JPG, PNG or GIF. Max 2MB.
              </p>
            </div>
          </div>

          {/* Color Picker */}
          <div className="space-y-2">
            <Label>Avatar Color (for initials)</Label>
            <p className="text-xs text-muted-foreground mb-2">
              This color shows when you don't have a photo, or as a fallback.
            </p>
            <div className="flex flex-wrap gap-2">
              {AVATAR_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setProfile({ ...profile, avatar_color: color.value })}
                  className={cn(
                    "w-8 h-8 rounded-full transition-all",
                    color.value,
                    profile.avatar_color === color.value
                      ? "ring-2 ring-offset-2 ring-primary"
                      : "hover:scale-110"
                  )}
                  title={color.name}
                />
              ))}
              <button
                type="button"
                onClick={() => setProfile({ ...profile, avatar_color: null })}
                className={cn(
                  "w-8 h-8 rounded-full border-2 border-dashed border-muted-foreground/50 flex items-center justify-center text-xs text-muted-foreground transition-all",
                  profile.avatar_color === null
                    ? "ring-2 ring-offset-2 ring-primary"
                    : "hover:scale-110"
                )}
                title="Auto (based on username)"
              >
                A
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Information
          </CardTitle>
          <CardDescription>
            Your username is displayed in chats and forums to protect your privacy. You can change it anytime.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="username">Username (public)</Label>
              <Input
                id="username"
                value={profile.username}
                onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                placeholder="Your public username"
              />
              <p className="text-xs text-muted-foreground">
                This is shown in chats, forums, and messages
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name (private)</Label>
              <Input
                id="full_name"
                value={profile.full_name}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                placeholder="Your real name (optional)"
              />
              <p className="text-xs text-muted-foreground">
                Only visible to you in settings
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location Card */}
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