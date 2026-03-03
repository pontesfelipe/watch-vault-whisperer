import { useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const QUEUE_KEY = "sora_offline_queue";

interface QueuedWearEntry {
  watch_id: string;
  wear_date: string;
  days: number;
  user_id: string;
  notes?: string;
  queued_at: string;
}

function getQueue(): QueuedWearEntry[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveQueue(queue: QueuedWearEntry[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function enqueueWearEntry(entry: Omit<QueuedWearEntry, "queued_at">) {
  const queue = getQueue();
  queue.push({ ...entry, queued_at: new Date().toISOString() });
  saveQueue(queue);
}

async function flushQueue() {
  const queue = getQueue();
  if (queue.length === 0) return;

  toast.info(`Syncing ${queue.length} pending ${queue.length === 1 ? "entry" : "entries"}...`);

  const failed: QueuedWearEntry[] = [];

  for (const entry of queue) {
    const { queued_at, ...data } = entry;
    const { error } = await supabase.from("wear_entries").insert(data);
    if (error) {
      console.error("Failed to sync queued entry:", error);
      failed.push(entry);
    }
  }

  saveQueue(failed);

  if (failed.length === 0) {
    toast.success("All entries synced!");
  } else {
    toast.warning(`${failed.length} ${failed.length === 1 ? "entry" : "entries"} failed to sync. Will retry later.`);
  }
}

export function useOfflineQueue() {
  const flush = useCallback(() => {
    flushQueue();
  }, []);

  useEffect(() => {
    // Flush on mount if online
    if (navigator.onLine) {
      flushQueue();
    }

    const handleOnline = () => flushQueue();
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, []);

  return { enqueueWearEntry, flush };
}
