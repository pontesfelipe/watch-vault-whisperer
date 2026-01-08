import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  username?: string | null;
  fullName?: string | null;
  avatarUrl?: string | null;
  avatarColor?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

// Available avatar colors for user selection
export const AVATAR_COLORS = [
  { name: "Blue", value: "bg-blue-500" },
  { name: "Green", value: "bg-green-500" },
  { name: "Purple", value: "bg-purple-500" },
  { name: "Orange", value: "bg-orange-500" },
  { name: "Pink", value: "bg-pink-500" },
  { name: "Teal", value: "bg-teal-500" },
  { name: "Indigo", value: "bg-indigo-500" },
  { name: "Rose", value: "bg-rose-500" },
  { name: "Cyan", value: "bg-cyan-500" },
  { name: "Amber", value: "bg-amber-500" },
  { name: "Emerald", value: "bg-emerald-500" },
  { name: "Violet", value: "bg-violet-500" },
];

// Generate a consistent color based on the username
function getAutoAvatarColor(name: string): string {
  const colors = AVATAR_COLORS.map(c => c.value);
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}

// Get initials from username (preferred) or fall back to full name
function getInitials(username?: string | null, fullName?: string | null): string {
  // Prefer username initials
  if (username && username.trim()) {
    // For usernames like "SwiftHawk123", extract capital letters or first 2 chars
    const capitals = username.match(/[A-Z]/g);
    if (capitals && capitals.length >= 2) {
      return capitals.slice(0, 2).join("");
    }
    return username.slice(0, 2).toUpperCase();
  }
  
  // Fallback to full name initials
  if (fullName && fullName.trim()) {
    const parts = fullName.trim().split(" ").filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return fullName.slice(0, 2).toUpperCase();
  }
  
  return "??";
}

export function UserAvatar({ 
  username, 
  fullName, 
  avatarUrl,
  avatarColor,
  size = "md", 
  className 
}: UserAvatarProps) {
  const initials = getInitials(username, fullName);
  const displayName = username || fullName || "User";
  const bgColor = avatarColor || getAutoAvatarColor(displayName);
  
  const sizeClasses = {
    sm: "h-6 w-6 text-xs",
    md: "h-8 w-8 text-sm",
    lg: "h-10 w-10 text-base",
  };

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
      <AvatarFallback className={cn(bgColor, "text-white font-medium")}>
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
