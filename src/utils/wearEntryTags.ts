import { supabase } from "@/integrations/supabase/client";

/**
 * Replace all tags on a wear entry with the provided list.
 * Deletes existing assignments and inserts the new ones.
 */
export const syncWearEntryTags = async (
  wearEntryId: string,
  tagIds: string[]
): Promise<void> => {
  if (!wearEntryId) return;

  // Remove existing tags for this entry
  await (supabase.from("wear_entry_tags" as any) as any)
    .delete()
    .eq("wear_entry_id", wearEntryId);

  if (tagIds.length === 0) return;

  // Insert new tag assignments
  const rows = tagIds.map((tag_id) => ({
    wear_entry_id: wearEntryId,
    tag_id,
  }));

  await (supabase.from("wear_entry_tags" as any) as any).insert(rows);
};

export const fetchWearEntryTagIds = async (
  wearEntryId: string
): Promise<string[]> => {
  if (!wearEntryId) return [];
  const { data } = await (supabase.from("wear_entry_tags" as any) as any)
    .select("tag_id")
    .eq("wear_entry_id", wearEntryId);
  return (data as Array<{ tag_id: string }> | null)?.map((r) => r.tag_id) ?? [];
};