import { formatDistanceToNow } from "date-fns";
import { UserMinus, MessageCircle } from "lucide-react";
import { Friend, Conversation } from "@/hooks/useMessaging";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface FriendsListProps {
  friends: Friend[];
  conversations: Conversation[];
  onRemove: (friendId: string) => Promise<{ success?: boolean; error?: string }>;
  onStartChat: (conversation: Conversation) => void;
}

export function FriendsList({ friends, conversations, onRemove, onStartChat }: FriendsListProps) {
  if (friends.length === 0) {
    return (
      <div className="text-center text-textMuted py-8">
        <p className="text-sm">No friends yet</p>
        <p className="text-xs mt-1">Send a friend request to start connecting</p>
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
          <Card key={friend.id} className="p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <span className="font-medium text-textMain text-sm truncate block">
                  {friend.friend_name || friend.friend_email}
                </span>
                {friend.friend_name && (
                  <span className="text-xs text-textMuted truncate block">
                    {friend.friend_email}
                  </span>
                )}
                <p className="text-xs text-textMuted mt-1">
                  Friends since {formatDistanceToNow(new Date(friend.created_at), { addSuffix: true })}
                </p>
              </div>
              <div className="flex gap-1">
                {conversation && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => onStartChat(conversation)}
                  >
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                )}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove Friend</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to remove {friend.friend_name || friend.friend_email} from your friends?
                        This will also delete your conversation history.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onRemove(friend.friend_id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Remove
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
