import { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";

interface PullToRefreshContainerProps {
  onRefresh: () => Promise<void> | void;
  children: ReactNode;
  className?: string;
}

export function PullToRefreshContainer({
  onRefresh,
  children,
  className = "",
}: PullToRefreshContainerProps) {
  const { containerRef, pulling, refreshing, pullDistance } = usePullToRefresh({
    onRefresh,
  });

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Pull indicator */}
      {(pulling || refreshing) && (
        <div
          className="flex items-center justify-center overflow-hidden transition-all duration-200"
          style={{ height: refreshing ? 40 : pullDistance }}
        >
          <Loader2
            className={`h-5 w-5 text-primary ${refreshing ? "animate-spin" : ""}`}
            style={{
              opacity: Math.min(pullDistance / 60, 1),
              transform: `rotate(${pullDistance * 3}deg)`,
            }}
          />
        </div>
      )}
      {children}
    </div>
  );
}
