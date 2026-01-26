import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface UserAvatarByIdProps {
  userId: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

// Available avatar colors for user selection
const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-green-500",
  "bg-purple-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-teal-500",
  "bg-indigo-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-violet-500",
];

function getAutoAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(username?: string | null, fullName?: string | null): string {
  if (username && username.trim()) {
    const capitals = username.match(/[A-Z]/g);
    if (capitals && capitals.length >= 2) {
      return capitals.slice(0, 2).join("");
    }
    return username.slice(0, 2).toUpperCase();
  }
  
  if (fullName && fullName.trim()) {
    const parts = fullName.trim().split(" ").filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return fullName.slice(0, 2).toUpperCase();
  }
  
  return "??";
}

// Cache for user profiles
const profileCache = new Map<string, { username: string | null; fullName: string | null; avatarUrl: string | null; avatarColor: string | null }>();

export function UserAvatarById({ userId, size = "md", className }: UserAvatarByIdProps) {
  const [profile, setProfile] = useState<{
    username: string | null;
    fullName: string | null;
    avatarUrl: string | null;
    avatarColor: string | null;
  } | null>(profileCache.get(userId) || null);

  useEffect(() => {
    if (profileCache.has(userId)) {
      setProfile(profileCache.get(userId)!);
      return;
    }

    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("username, full_name, avatar_url, avatar_color")
        .eq("id", userId)
        .single();

      if (data) {
        const profileData = {
          username: data.username,
          fullName: data.full_name,
          avatarUrl: data.avatar_url,
          avatarColor: data.avatar_color,
        };
        profileCache.set(userId, profileData);
        setProfile(profileData);
      }
    };

    fetchProfile();
  }, [userId]);

  const initials = getInitials(profile?.username, profile?.fullName);
  const displayName = profile?.username || profile?.fullName || userId;
  const bgColor = profile?.avatarColor || getAutoAvatarColor(displayName);

  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-16 w-16 text-lg",
  };

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      {profile?.avatarUrl && <AvatarImage src={profile.avatarUrl} alt={displayName} />}
      <AvatarFallback className={cn(bgColor, "text-white font-medium")}>
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
