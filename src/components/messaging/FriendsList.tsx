import { Friend, Conversation } from "@/hooks/useMessaging";
import { useIsMobile } from "@/hooks/use-mobile";
import { SwipeableFriendItem } from "./SwipeableFriendItem";

interface FriendsListProps {
  friends: Friend[];
  conversations: Conversation[];
  onRemove: (friendId: string) => Promise<{ success?: boolean; error?: string }>;
  onStartChat: (conversation: Conversation) => void;
}

export function FriendsList({ friends, conversations, onRemove, onStartChat }: FriendsListProps) {
  const isMobile = useIsMobile();

  if (friends.length === 0) {
    return (
      <div className="text-center text-textMuted py-8">
        <p className="text-sm">No friends yet</p>
        <p className="text-xs mt-1">Send a friend request to start connecting</p>
        {isMobile && (
          <p className="text-xs mt-3 text-accent">Tip: Swipe left on items to reveal actions</p>
        )}
      </div>
    );
  }

  const getConversationForFriend = (friendId: string) => {
    return conversations.find(
      (c) => c.user1_id === friendId || c.user2_id === friendId
    );
  };

  return (
    <div className="space-y-2">
      {friends.map((friend) => {
        const conversation = getConversationForFriend(friend.friend_id);
        
        return (
          <SwipeableFriendItem
            key={friend.id}
            friend={friend}
            conversation={conversation}
            onRemove={onRemove}
            onStartChat={onStartChat}
            isMobile={isMobile}
          />
        );
      })}
    </div>
  );
}
