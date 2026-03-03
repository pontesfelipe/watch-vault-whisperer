import { Skeleton } from "@/components/ui/skeleton";

export const FeedItemSkeleton = () => (
  <div className="rounded-xl border border-borderSubtle bg-surface p-4 space-y-3">
    <div className="flex items-center gap-3">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="space-y-1.5 flex-1">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-40 w-full rounded-lg" />
    <div className="flex gap-4 pt-1">
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-8 w-16" />
    </div>
  </div>
);
