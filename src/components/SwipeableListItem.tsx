import { useState, ReactNode } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { Trash2 } from "lucide-react";
import { triggerHaptic } from "@/utils/haptics";
import { cn } from "@/lib/utils";

interface SwipeableListItemProps {
  children: ReactNode;
  onDelete?: () => void;
  onSwipeReveal?: () => void;
  deleteLabel?: string;
  className?: string;
  disabled?: boolean;
  swipeThreshold?: number;
}

/**
 * A reusable swipeable list item component for mobile
 * Swipe left to reveal delete action with haptic feedback
 */
export function SwipeableListItem({
  children,
  onDelete,
  onSwipeReveal,
  deleteLabel = "Delete",
  className,
  disabled = false,
  swipeThreshold = -80,
}: SwipeableListItemProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const x = useMotionValue(0);
  const deleteOpacity = useTransform(x, [swipeThreshold, swipeThreshold / 2, 0], [1, 0.5, 0]);
  const deleteScale = useTransform(x, [swipeThreshold, swipeThreshold / 2, 0], [1, 0.8, 0.6]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (disabled) return;
    
    if (info.offset.x < swipeThreshold) {
      if (!isRevealed) {
        triggerHaptic('medium');
        onSwipeReveal?.();
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

  const handleContentClick = () => {
    if (isRevealed) {
      setIsRevealed(false);
    }
  };

  if (disabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Delete action background */}
      <motion.div
        className="absolute inset-y-0 right-0 flex items-center justify-end bg-destructive rounded-r-lg"
        style={{ opacity: deleteOpacity, width: Math.abs(swipeThreshold) }}
      >
        <motion.button
          className="h-full w-full flex items-center justify-center text-white gap-2 px-3"
          style={{ scale: deleteScale }}
          onClick={handleDeleteClick}
          aria-label={deleteLabel}
        >
          <Trash2 className="w-5 h-5" />
          <span className="text-sm font-medium sr-only sm:not-sr-only">{deleteLabel}</span>
        </motion.button>
      </motion.div>

      {/* Swipeable content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: swipeThreshold, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        animate={{ x: isRevealed ? swipeThreshold : 0 }}
        style={{ x }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={cn("relative bg-surface touch-pan-y", className)}
        onClick={handleContentClick}
      >
        {children}
      </motion.div>
    </div>
  );
}
