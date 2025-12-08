import { formatDistanceToNow } from "date-fns";
import { Conversation } from "@/hooks/useMessaging";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (conversation: Conversation) => void;
}

export function ConversationList({ conversations, selectedId, onSelect }: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="p-4 text-center text-textMuted">
        <p className="text-sm">No conversations yet</p>
        <p className="text-xs mt-1">Add a friend to start chatting</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-borderSubtle">
      {conversations.map((conversation) => (
        <button
          key={conversation.id}
          onClick={() => onSelect(conversation)}
          className={cn(
            "w-full p-3 text-left transition-colors hover:bg-surfaceMuted",
            selectedId === conversation.id && "bg-accentSubtle"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="font-medium text-textMain text-sm truncate">
              {conversation.other_user_name || conversation.other_user_email}
            </span>
            {(conversation.unread_count ?? 0) > 0 && (
              <Badge variant="default" className="ml-2 h-5 min-w-5 flex items-center justify-center text-xs">
                {conversation.unread_count}
              </Badge>
            )}
          </div>
          {conversation.last_message && (
            <p className="text-xs text-textMuted mt-1 truncate">
              {conversation.last_message}
            </p>
          )}
          <p className="text-xs text-textMuted mt-1">
            {formatDistanceToNow(new Date(conversation.updated_at), { addSuffix: true })}
          </p>
        </button>
      ))}
    </div>
  );
}
