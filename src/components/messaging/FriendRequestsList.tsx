import { formatDistanceToNow } from "date-fns";
import { Check, X, Sparkles } from "lucide-react";
import { FriendRequest } from "@/hooks/useMessaging";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface FriendRequestsListProps {
  requests: FriendRequest[];
  onAccept: (requestId: string) => Promise<{ success?: boolean; error?: string }>;
  onDecline: (requestId: string) => Promise<{ success?: boolean; error?: string }>;
}

export function FriendRequestsList({ requests, onAccept, onDecline }: FriendRequestsListProps) {
  if (requests.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-textMain px-1">Friend Requests</h3>
      {requests.map((request) => {
        const isTradeRequest = !!request.trade_match_watch_id || request.message?.toLowerCase().includes('trade');
        
        return (
          <Card 
            key={request.id} 
            className={`p-3 ${isTradeRequest ? 'border-primary/30 bg-primary/5' : ''}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground text-sm truncate">
                    {request.from_user_name || request.from_user_email}
                  </span>
                  {isTradeRequest && (
                    <Badge variant="secondary" className="text-xs bg-primary/20 text-primary">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Trade Interest
                    </Badge>
                  )}
                </div>
                {request.message && (
                  <p className="text-sm text-muted-foreground mt-2 bg-muted/50 p-2 rounded-md">
                    "{request.message}"
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                </p>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-green-500 hover:text-green-600 hover:bg-green-500/10"
                  onClick={() => onAccept(request.id)}
                  title="Accept"
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => onDecline(request.id)}
                  title="Decline"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
