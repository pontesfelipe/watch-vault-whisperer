import { useState } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { Trash2, MessageSquare, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Conversation } from "@/hooks/useVaultPalChat";
import { triggerHaptic } from "@/utils/haptics";

interface SwipeableConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onEdit: () => void;
  searchQuery?: string;
  isMobile: boolean;
}

const SWIPE_THRESHOLD = -80;

export const SwipeableConversationItem = ({
  conversation,
  isActive,
  onSelect,
  onDelete,
  onEdit,
  searchQuery = "",
  isMobile,
}: SwipeableConversationItemProps) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const x = useMotionValue(0);
  const deleteOpacity = useTransform(x, [-100, -50, 0], [1, 0.5, 0]);
  const deleteScale = useTransform(x, [-100, -50, 0], [1, 0.8, 0.6]);

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-accent/30 text-textMain rounded px-0.5">{part}</mark>
      ) : part
    );
  };

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
    onDelete();
    setIsRevealed(false);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('selection');
    onEdit();
  };

  // Desktop version - no swipe, show buttons on hover
  if (!isMobile) {
    return (
      <div
        className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 cursor-pointer transition-colors ${
          isActive ? "bg-accent/10" : "hover:bg-surfaceMuted"
        }`}
        onClick={onSelect}
      >
        <MessageSquare className="w-4 h-4 shrink-0 text-textMuted" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-textMain truncate">
            {highlightMatch(conversation.title, searchQuery)}
          </p>
          <p className="text-xs text-textMuted">
            {format(new Date(conversation.updated_at), "MMM d, h:mm a")}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-textMuted hover:text-textMain hover:bg-surfaceMuted"
            onClick={handleEditClick}
            aria-label="Rename conversation"
            title="Rename"
          >
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-textMuted hover:text-destructive hover:bg-surfaceMuted"
            onClick={handleDeleteClick}
            aria-label="Delete conversation"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    );
  }

  // Mobile version - swipeable
  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Delete action background */}
      <motion.div
        className="absolute inset-y-0 right-0 flex items-center justify-end bg-destructive rounded-r-lg"
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

      {/* Swipeable content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -80, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        animate={{ x: isRevealed ? -80 : 0 }}
        style={{ x }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={`relative flex items-center gap-2 px-3 py-3 cursor-pointer transition-colors bg-surface ${
          isActive ? "bg-accent/10" : ""
        }`}
        onClick={() => {
          if (!isRevealed) {
            onSelect();
          } else {
            setIsRevealed(false);
          }
        }}
      >
        <MessageSquare className="w-4 h-4 shrink-0 text-textMuted" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-textMain truncate">
            {highlightMatch(conversation.title, searchQuery)}
          </p>
          <p className="text-xs text-textMuted">
            {format(new Date(conversation.updated_at), "MMM d, h:mm a")}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-textMuted hover:text-textMain"
            onClick={handleEditClick}
            aria-label="Rename conversation"
            title="Rename"
          >
            <Pencil className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>
    </div>
  );
};
