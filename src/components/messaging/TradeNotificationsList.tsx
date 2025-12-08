import { formatDistanceToNow } from "date-fns";
import { Sparkles, X, UserPlus } from "lucide-react";
import { TradeMatchNotification } from "@/hooks/useMessaging";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface TradeNotificationsListProps {
  notifications: TradeMatchNotification[];
  onDismiss: (notificationId: string) => Promise<void>;
  onSendFriendRequest: (email: string, message: string) => Promise<{ success?: boolean; error?: string }>;
}

export function TradeNotificationsList({ 
  notifications, 
  onDismiss, 
  onSendFriendRequest 
}: TradeNotificationsListProps) {
  if (notifications.length === 0) {
    return null;
  }

  const handleConnect = async (notification: TradeMatchNotification) => {
    const message = `Hi! I noticed you have a ${notification.watch_brand} ${notification.watch_model} available for trade. I have this watch on my wishlist and would love to discuss a potential trade!`;
    await onSendFriendRequest(notification.owner_email!, message);
    await onDismiss(notification.id);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-1">
        <Sparkles className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-medium text-textMain">Trade Matches</h3>
      </div>
      {notifications.map((notification) => (
        <Card key={notification.id} className="p-3 border-primary/30 bg-primary/5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-textMain">
                <span className="font-medium">{notification.watch_brand} {notification.watch_model}</span>
                {" is available for trade!"}
              </p>
              <p className="text-xs text-textMuted mt-1">
                Owned by {notification.owner_email}
              </p>
              <p className="text-xs text-textMuted">
                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
              </p>
            </div>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="default"
                className="h-8 text-xs"
                onClick={() => handleConnect(notification)}
              >
                <UserPlus className="h-3 w-3 mr-1" />
                Connect
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-textMuted hover:text-textMain"
                onClick={() => onDismiss(notification.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
