import { useState } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Conversation } from "@/hooks/useMessaging";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { triggerHaptic } from "@/utils/haptics";

interface SwipeableConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onSelect: () => void;
  onDelete?: () => void;
  isMobile: boolean;
}

const SWIPE_THRESHOLD = -80;

export function SwipeableConversationItem({
  conversation,
  isSelected,
  onSelect,
  onDelete,
  isMobile,
}: SwipeableConversationItemProps) {
  const [isRevealed, setIsRevealed] = useState(false);
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

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('heavy');
    onDelete?.();
    setIsRevealed(false);
  };

  const content = (
    <div className="flex items-center gap-3 w-full">
      <div className="flex-1 min-w-0">
        {/* Row 1: Name + Timestamp */}
        <div className="flex items-center gap-2">
          <span className="font-medium text-textMain text-sm truncate flex-1">
            {conversation.other_user_name || conversation.other_user_email}
          </span>
          <span className="text-[11px] text-textMuted whitespace-nowrap shrink-0">
            {formatDistanceToNow(new Date(conversation.updated_at), { addSuffix: true })}
          </span>
        </div>
        {/* Row 2: Message preview + Badge */}
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-xs text-textMuted truncate flex-1">
            {conversation.last_message || "No messages yet"}
          </p>
          {(conversation.unread_count ?? 0) > 0 && (
            <Badge 
              variant="default" 
              className="h-5 min-w-5 px-1.5 flex items-center justify-center text-[10px] font-medium shrink-0 rounded-full"
            >
              {conversation.unread_count}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );

  // Desktop version - no swipe
  if (!isMobile) {
    return (
      <button
        onClick={onSelect}
        className={cn(
          "w-full p-3 text-left transition-colors hover:bg-surfaceMuted touch-target",
          isSelected && "bg-accentSubtle"
        )}
      >
        {content}
      </button>
    );
  }

  // Mobile version - swipeable
  return (
    <div className="relative overflow-hidden">
      {/* Delete action background */}
      {onDelete && (
        <motion.div
          className="absolute inset-y-0 right-0 flex items-center justify-end bg-destructive"
          style={{ opacity: deleteOpacity, width: 80 }}
        >
          <motion.button
            className="h-full w-full flex items-center justify-center text-white"
            style={{ scale: deleteScale }}
            onClick={handleDeleteClick}
            aria-label="Delete conversation"
          >
            <Trash2 className="w-5 h-5" />
          </motion.button>
        </motion.div>
      )}

      {/* Swipeable content */}
      <motion.button
        drag={onDelete ? "x" : false}
        dragConstraints={{ left: -80, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        animate={{ x: isRevealed ? -80 : 0 }}
        style={{ x }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={cn(
          "relative w-full p-3 text-left transition-colors bg-surface touch-pan-y touch-target",
          isSelected && "bg-accentSubtle"
        )}
        onClick={() => {
          if (!isRevealed) {
            triggerHaptic('selection');
            onSelect();
          } else {
            setIsRevealed(false);
          }
        }}
      >
        {content}
      </motion.button>
    </div>
  );
}
