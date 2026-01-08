import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
}

export interface MentionNotification {
  id: string;
  user_id: string;
  mentioned_by_user_id: string;
  comment_id: string;
  post_id: string;
  is_read: boolean;
  created_at: string;
  mentioned_by?: Profile;
  post_title?: string;
}

export function useUserSearch() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);

  const searchUsers = useCallback(async (query: string) => {
    if (query.length < 2) {
      setUsers([]);
      return;
    }

    setSearching(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, avatar_url")
        .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(5);

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Error searching users:", error);
      setUsers([]);
    } finally {
      setSearching(false);
    }
  }, []);

  return { users, searching, searchUsers, clearUsers: () => setUsers([]) };
}

export function useMentionNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<MentionNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("mention_notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      // Enrich with profile and post data
      const mentionedByIds = [...new Set(data?.map((n) => n.mentioned_by_user_id) || [])];
      const postIds = [...new Set(data?.map((n) => n.post_id) || [])];

      const [profilesRes, postsRes] = await Promise.all([
        supabase.from("profiles").select("id, email, full_name, avatar_url").in("id", mentionedByIds),
        supabase.from("posts").select("id, title").in("id", postIds),
      ]);

      const profileMap = new Map(profilesRes.data?.map((p) => [p.id, p]) || []);
      const postMap = new Map(postsRes.data?.map((p) => [p.id, p.title]) || []);

      const enriched: MentionNotification[] = (data || []).map((n) => ({
        ...n,
        mentioned_by: profileMap.get(n.mentioned_by_user_id),
        post_title: postMap.get(n.post_id),
      }));

      setNotifications(enriched);
      setUnreadCount(enriched.filter((n) => !n.is_read).length);
    } catch (error) {
      console.error("Error fetching mention notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from("mention_notifications")
        .update({ is_read: true })
        .eq("id", notificationId);

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      await supabase
        .from("mention_notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  };
}

// Utility to extract @mentions from text
export function extractMentions(text: string): string[] {
  const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
  const mentions: string[] = [];
  let match;
  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[2]); // user id
  }
  return mentions;
}

// Utility to format mention text for display
export function formatMentionText(text: string): string {
  return text.replace(/@\[([^\]]+)\]\(([^)]+)\)/g, "@$1");
}

// Create mention notifications
export async function createMentionNotifications(
  mentions: string[],
  mentionedByUserId: string,
  commentId: string,
  postId: string
) {
  if (mentions.length === 0) return;

  // Filter out self-mentions
  const validMentions = mentions.filter((userId) => userId !== mentionedByUserId);
  if (validMentions.length === 0) return;

  try {
    const notifications = validMentions.map((userId) => ({
      user_id: userId,
      mentioned_by_user_id: mentionedByUserId,
      comment_id: commentId,
      post_id: postId,
    }));

    await supabase.from("mention_notifications").insert(notifications);
  } catch (error) {
    console.error("Error creating mention notifications:", error);
  }
}
