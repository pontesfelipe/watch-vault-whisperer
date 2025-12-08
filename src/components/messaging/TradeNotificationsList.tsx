import { formatDistanceToNow } from "date-fns";
import { Sparkles, X, UserPlus, Watch, Eye } from "lucide-react";
import { TradeMatchNotification } from "@/hooks/useMessaging";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
        <h3 className="text-sm font-medium text-foreground">Trade Matches</h3>
      </div>
      {notifications.map((notification) => (
        <Card key={notification.id} className="p-4 border-primary/30 bg-primary/5">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <Watch className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold text-foreground">
                    {notification.watch_brand} {notification.watch_model}
                  </p>
                  <Badge variant="secondary" className="mt-1 text-xs">
                    Available for Trade
                  </Badge>
                </div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
                onClick={() => onDismiss(notification.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="text-sm text-muted-foreground space-y-2">
              <div className="flex items-center gap-2 bg-muted/50 p-2 rounded-md">
                <Eye className="h-4 w-4 text-primary" />
                <span className="text-xs">
                  Owner details will be revealed after they accept your request
                </span>
              </div>
              <p className="text-xs">
                Found {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
              </p>
            </div>

            <Button
              size="sm"
              className="w-full"
              onClick={() => handleConnect(notification)}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Connect to Discuss Trade
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
