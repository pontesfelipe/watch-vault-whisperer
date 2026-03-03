import { useRef, useState, useCallback, useEffect } from "react";
import { triggerHaptic } from "@/utils/haptics";

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void> | void;
  threshold?: number;
  disabled?: boolean;
}

export function usePullToRefresh({
  onRefresh,
  threshold = 60,
  disabled = false,
}: UsePullToRefreshOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const isPulling = useRef(false);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (disabled || refreshing) return;
      const el = containerRef.current;
      if (!el || el.scrollTop > 0) return;
      startY.current = e.touches[0].clientY;
      isPulling.current = true;
    },
    [disabled, refreshing]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isPulling.current || disabled || refreshing) return;
      const el = containerRef.current;
      if (!el || el.scrollTop > 0) {
        isPulling.current = false;
        setPulling(false);
        setPullDistance(0);
        return;
      }

      const diff = e.touches[0].clientY - startY.current;
      if (diff > 0) {
        // Dampen the pull distance
        const dampened = Math.min(diff * 0.4, 120);
        setPullDistance(dampened);
        setPulling(true);
      }
    },
    [disabled, refreshing]
  );

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling.current) return;
    isPulling.current = false;

    if (pullDistance >= threshold && !refreshing) {
      setRefreshing(true);
      triggerHaptic("medium");
      try {
        await onRefresh();
      } catch (e) {
        console.error("Pull-to-refresh error:", e);
      } finally {
        setRefreshing(false);
      }
    }

    setPulling(false);
    setPullDistance(0);
  }, [pullDistance, threshold, refreshing, onRefresh]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchmove", handleTouchMove, { passive: true });
    el.addEventListener("touchend", handleTouchEnd);

    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    containerRef,
    pulling,
    refreshing,
    pullDistance,
  };
}
