import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  username?: string | null;
  fullName?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

// Generate a consistent color based on the username
function getAvatarColor(name: string): string {
  const colors = [
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
  ];
  
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

export function UserAvatar({ username, fullName, size = "md", className }: UserAvatarProps) {
  const initials = getInitials(username, fullName);
  const displayName = username || fullName || "User";
  const bgColor = getAvatarColor(displayName);
  
  const sizeClasses = {
    sm: "h-6 w-6 text-xs",
    md: "h-8 w-8 text-sm",
    lg: "h-10 w-10 text-base",
  };

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      <AvatarFallback className={cn(bgColor, "text-white font-medium")}>
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
