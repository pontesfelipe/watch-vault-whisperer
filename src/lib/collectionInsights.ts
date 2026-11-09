import { isPastStatus } from "@/lib/itemStatus";

interface CollectionHistoryItem {
  collection_id: string | null;
  archived_collection_id: string | null;
  user_id: string | null;
  status: string;
}

export function belongsToCollectionInsights(
  item: CollectionHistoryItem,
  collectionId: string,
  userId: string,
): boolean {
  return item.collection_id === collectionId || (
    item.collection_id === null &&
    item.archived_collection_id === collectionId &&
    item.user_id === userId &&
    isPastStatus(item.status)
  );
}