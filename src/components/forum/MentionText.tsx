import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface MentionTextProps {
  content: string;
  className?: string;
}

export function MentionText({ content, className }: MentionTextProps) {
  // Parse content and replace @[name](userId) with styled links
  const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    // Add text before the mention
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }

    const displayName = match[1];
    const userId = match[2];

    // Add the styled mention link
    parts.push(
      <Link
        key={`${userId}-${match.index}`}
        to={`/messages?user=${userId}`}
        className="inline-flex items-center px-1.5 py-0.5 rounded bg-accent/20 text-accent hover:bg-accent/30 transition-colors font-medium"
        onClick={(e) => e.stopPropagation()}
      >
        @{displayName}
      </Link>
    );

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text after last mention
  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  // If no mentions found, return plain text
  if (parts.length === 0) {
    return <span className={className}>{content}</span>;
  }

  return <span className={cn("whitespace-pre-wrap", className)}>{parts}</span>;
}
