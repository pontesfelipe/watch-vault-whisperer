import { useState } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { UserMinus, MessageCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Friend, Conversation } from "@/hooks/useMessaging";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { triggerHaptic } from "@/utils/haptics";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SwipeableFriendItemProps {
  friend: Friend;
  conversation?: Conversation;
  onRemove: (friendId: string) => Promise<{ success?: boolean; error?: string }>;
  onStartChat: (conversation: Conversation) => void;
  isMobile: boolean;
}

const SWIPE_THRESHOLD = -80;

export function SwipeableFriendItem({
  friend,
  conversation,
  onRemove,
  onStartChat,
  isMobile,
}: SwipeableFriendItemProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const x = useMotionValue(0);
  const deleteOpacity = useTransform(x, [-100, -50, 0], [1, 0.5, 0]);
  const deleteScale = useTransform(x, [-100, -50, 0], [1, 0.8, 0.6]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x < SWIPE_THRESHOLD) {
      if (!isRevealed) {
        triggerHaptic('medium');
      }
      setIsRevealed(true);
    } else {
      setIsRevealed(false);
    }
  };

  const handleRemoveClick = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    triggerHaptic('warning');
    setShowRemoveDialog(true);
    setIsRevealed(false);
  };

  const handleConfirmRemove = () => {
    triggerHaptic('heavy');
    onRemove(friend.friend_id);
    setShowRemoveDialog(false);
  };

  const handleChatClick = () => {
    if (conversation) {
      triggerHaptic('selection');
      onStartChat(conversation);
    }
  };

  const content = (
    <div className="flex items-center justify-between gap-2 w-full">
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
      {!isMobile && (
        <div className="flex gap-1">
          {conversation && (
            <Button
              size="icon"
              variant="ghost"
              className="h-10 w-10 touch-target-sm"
              onClick={handleChatClick}
            >
              <MessageCircle className="h-4 w-4" />
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            className="h-10 w-10 text-destructive hover:text-destructive hover:bg-destructive/10 touch-target-sm"
            onClick={() => handleRemoveClick()}
          >
            <UserMinus className="h-4 w-4" />
          </Button>
        </div>
      )}
      {isMobile && conversation && (
        <Button
          size="icon"
          variant="ghost"
          className="h-10 w-10 touch-target-sm shrink-0"
          onClick={handleChatClick}
        >
          <MessageCircle className="h-4 w-4" />
        </Button>
      )}
    </div>
  );

  // Desktop version - no swipe
  if (!isMobile) {
    return (
      <>
        <Card className="p-3 touch-active">{content}</Card>
        <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
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
                onClick={handleConfirmRemove}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  // Mobile version - swipeable
  return (
    <>
      <div className="relative overflow-hidden rounded-lg">
        {/* Remove action background */}
        <motion.div
          className="absolute inset-y-0 right-0 flex items-center justify-end bg-destructive rounded-r-lg"
          style={{ opacity: deleteOpacity, width: 80 }}
        >
          <motion.button
            className="h-full w-full flex items-center justify-center text-white"
            style={{ scale: deleteScale }}
            onClick={handleRemoveClick}
            aria-label="Remove friend"
          >
            <UserMinus className="w-5 h-5" />
          </motion.button>
        </motion.div>

        {/* Swipeable content */}
        <motion.div
          drag="x"
          dragConstraints={{ left: -80, right: 0 }}
          dragElastic={0.1}
          onDragEnd={handleDragEnd}
          animate={{ x: isRevealed ? -80 : 0 }}
          style={{ x }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="relative bg-surface touch-pan-y"
          onClick={() => {
            if (isRevealed) {
              setIsRevealed(false);
            }
          }}
        >
          <Card className="p-3 border-0 shadow-none touch-active">{content}</Card>
        </motion.div>
      </div>

      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
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
              onClick={handleConfirmRemove}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
