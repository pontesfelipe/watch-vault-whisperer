import { useState, useRef, useEffect, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUserSearch } from "@/hooks/useMentions";
import { cn } from "@/lib/utils";

interface MentionTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
  disabled?: boolean;
}

export function MentionTextarea({
  value,
  onChange,
  placeholder,
  className,
  rows = 2,
  disabled,
}: MentionTextareaProps) {
  const { users, searching, searchUsers, clearUsers } = useUserSearch();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionStartIndex, setMentionStartIndex] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Detect @ mentions while typing
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    onChange(newValue);
    
    // Check if we're in a mention
    const textBeforeCursor = newValue.slice(0, cursorPos);
    const atIndex = textBeforeCursor.lastIndexOf("@");
    
    if (atIndex !== -1) {
      const textAfterAt = textBeforeCursor.slice(atIndex + 1);
      // Check if there's a space before @ (or it's at the start)
      const charBeforeAt = atIndex > 0 ? newValue[atIndex - 1] : " ";
      
      if ((charBeforeAt === " " || charBeforeAt === "\n" || atIndex === 0) && 
          !textAfterAt.includes(" ") && !textAfterAt.includes("\n")) {
        setMentionQuery(textAfterAt);
        setMentionStartIndex(atIndex);
        searchUsers(textAfterAt);
        setShowSuggestions(true);
        setSelectedIndex(0);
        return;
      }
    }
    
    setShowSuggestions(false);
    setMentionStartIndex(null);
    clearUsers();
  };

  const insertMention = useCallback((user: { id: string; full_name: string | null; email: string }) => {
    if (mentionStartIndex === null) return;
    
    const displayName = user.full_name || user.email.split("@")[0];
    const mentionText = `@[${displayName}](${user.id})`;
    
    const before = value.slice(0, mentionStartIndex);
    const cursorPos = textareaRef.current?.selectionStart || value.length;
    const after = value.slice(cursorPos);
    
    const newValue = before + mentionText + " " + after;
    onChange(newValue);
    
    setShowSuggestions(false);
    setMentionStartIndex(null);
    clearUsers();
    
    // Focus back on textarea
    setTimeout(() => {
      textareaRef.current?.focus();
      const newCursorPos = mentionStartIndex + mentionText.length + 1;
      textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  }, [mentionStartIndex, value, onChange, clearUsers]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || users.length === 0) return;
    
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % users.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + users.length) % users.length);
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      insertMention(users[selectedIndex]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      clearUsers();
    }
  };

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Format display value (show @name instead of @[name](id))
  const displayValue = value.replace(/@\[([^\]]+)\]\([^)]+\)/g, "@$1");

  return (
    <div ref={containerRef} className="relative flex-1">
      <Textarea
        ref={textareaRef}
        value={displayValue}
        onChange={(e) => {
          // Reconstruct the actual value with mention syntax
          // This is a simplified approach - for complex editing, more logic would be needed
          const newDisplayValue = e.target.value;
          
          // If the values are similar length, use the raw change
          if (Math.abs(newDisplayValue.length - displayValue.length) <= 2) {
            handleChange(e);
          } else {
            onChange(newDisplayValue);
          }
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={cn("resize-none", className)}
        rows={rows}
        disabled={disabled}
      />
      
      {showSuggestions && users.length > 0 && (
        <div className="absolute z-50 w-64 mt-1 bg-surface border border-border rounded-md shadow-lg overflow-hidden">
          {users.map((user, index) => {
            const name = user.full_name || user.email.split("@")[0];
            const initials = name.slice(0, 2).toUpperCase();
            
            return (
              <button
                key={user.id}
                type="button"
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-surfaceMuted transition-colors",
                  index === selectedIndex && "bg-surfaceMuted"
                )}
                onClick={() => insertMention(user)}
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage src={user.avatar_url || undefined} />
                  <AvatarFallback className="bg-accent text-accent-foreground text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-textMain truncate">{name}</p>
                  <p className="text-xs text-textMuted truncate">{user.email}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
      
      {showSuggestions && searching && users.length === 0 && mentionQuery.length >= 2 && (
        <div className="absolute z-50 w-64 mt-1 bg-surface border border-border rounded-md shadow-lg p-3">
          <p className="text-sm text-textMuted">Searching...</p>
        </div>
      )}
      
      {showSuggestions && !searching && users.length === 0 && mentionQuery.length >= 2 && (
        <div className="absolute z-50 w-64 mt-1 bg-surface border border-border rounded-md shadow-lg p-3">
          <p className="text-sm text-textMuted">No users found</p>
        </div>
      )}
    </div>
  );
}
