import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { triggerHaptic } from "@/utils/haptics";

/**
 * iOS-style edge swipe back gesture.
 * Triggers navigate(-1) when the user swipes right from the leftmost 24px of the screen.
 * Mobile / touch only — no-op on desktop.
 */
export function useEdgeSwipeBack(enabled = true) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;

    let startX = 0;
    let startY = 0;
    let tracking = false;

    const onStart = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      if (t.clientX <= 24) {
        startX = t.clientX;
        startY = t.clientY;
        tracking = true;
      }
    };

    const onEnd = (e: TouchEvent) => {
      if (!tracking) return;
      tracking = false;
      const t = e.changedTouches[0];
      if (!t) return;
      const dx = t.clientX - startX;
      const dy = Math.abs(t.clientY - startY);
      // Require mostly-horizontal swipe of at least 80px
      if (dx > 80 && dy < 60) {
        triggerHaptic("light");
        navigate(-1);
      }
    };

    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchend", onEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchend", onEnd);
    };
  }, [enabled, navigate]);
}