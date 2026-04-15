import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, UserPlus, Heart, MessageSquare, AtSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, parseISO } from "date-fns";

interface NotificationItem {
  id: string;
  type: "friend_request" | "post_interaction" | "mention";
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
  link?: string;
  icon: "friend" | "like" | "comment" | "mention";
}

export function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const items: NotificationItem[] = [];

    try {
      // 1. Friend requests
      const { data: friendReqs } = await supabase
        .from("friend_requests")
        .select("id, from_user_id, created_at, message")
        .eq("to_user_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(5);

      if (friendReqs) {
        const userIds = friendReqs.map((r) => r.from_user_id);
        const { data: profiles } = userIds.length
          ? await supabase.from("public_profiles" as any).select("id, username").in("id", userIds)
          : { data: [] };
        const profileMap = new Map((profiles || []).map((p: any) => [p.id, p.username || "User"]));

        friendReqs.forEach((r) => {
          items.push({
            id: `fr-${r.id}`,
            type: "friend_request",
            title: "Friend Request",
            description: `${profileMap.get(r.from_user_id) || "Someone"} wants to be your friend`,
            timestamp: r.created_at,
            isRead: false,
            link: "/social?tab=messages&subtab=notifications",
            icon: "friend",
          });
        });
      }

      // 2. Mentions
      const { data: mentions } = await supabase
        .from("mention_notifications")
        .select("id, mentioned_by_user_id, post_id, is_read, created_at")
        .eq("user_id", user.id)
        .eq("is_read", false)
        .order("created_at", { ascending: false })
        .limit(5);

      if (mentions) {
        const mentionUserIds = mentions.map((m) => m.mentioned_by_user_id);
        const { data: mentionProfiles } = mentionUserIds.length
          ? await supabase.from("public_profiles" as any).select("id, username").in("id", mentionUserIds)
          : { data: [] };
        const mentionProfileMap = new Map((mentionProfiles || []).map((p: any) => [p.id, p.username || "User"]));

        mentions.forEach((m) => {
          items.push({
            id: `mention-${m.id}`,
            type: "mention",
            title: "Tagged in a post",
            description: `${mentionProfileMap.get(m.mentioned_by_user_id) || "Someone"} mentioned you`,
            timestamp: m.created_at,
            isRead: false,
            link: "/social?tab=forum",
            icon: "mention",
          });
        });
      }

      // 3. Post interactions (votes/comments on your posts)
      const { data: myPosts } = await supabase
        .from("posts")
        .select("id, title")
        .eq("user_id", user.id)
        .limit(50);

      if (myPosts && myPosts.length > 0) {
        const postIds = myPosts.map((p) => p.id);
        const postTitleMap = new Map(myPosts.map((p) => [p.id, p.title]));
        const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();

        const { data: recentVotes } = await supabase
          .from("post_votes")
          .select("id, post_id, user_id, vote_type, created_at")
          .in("post_id", postIds)
          .neq("user_id", user.id)
          .gte("created_at", sevenDaysAgo)
          .eq("vote_type", 1)
          .order("created_at", { ascending: false })
          .limit(5);

        if (recentVotes) {
          const voteUserIds = recentVotes.map((v) => v.user_id);
          const { data: voteProfiles } = voteUserIds.length
            ? await supabase.from("public_profiles" as any).select("id, username").in("id", voteUserIds)
            : { data: [] };
          const voteProfileMap = new Map((voteProfiles || []).map((p: any) => [p.id, p.username || "User"]));

          recentVotes.forEach((v) => {
            items.push({
              id: `vote-${v.id}`,
              type: "post_interaction",
              title: "Post liked",
              description: `${voteProfileMap.get(v.user_id) || "Someone"} liked "${postTitleMap.get(v.post_id) || "your post"}"`,
              timestamp: v.created_at,
              isRead: true,
              link: "/social?tab=forum",
              icon: "like",
            });
          });
        }

        const { data: recentComments } = await supabase
          .from("post_comments")
          .select("id, post_id, user_id, created_at")
          .in("post_id", postIds)
          .neq("user_id", user.id)
          .gte("created_at", sevenDaysAgo)
          .order("created_at", { ascending: false })
          .limit(5);

        if (recentComments) {
          const commentUserIds = recentComments.map((c) => c.user_id);
          const { data: commentProfiles } = commentUserIds.length
            ? await supabase.from("public_profiles" as any).select("id, username").in("id", commentUserIds)
            : { data: [] };
          const commentProfileMap = new Map((commentProfiles || []).map((p: any) => [p.id, p.username || "User"]));

          recentComments.forEach((c) => {
            items.push({
              id: `comment-${c.id}`,
              type: "post_interaction",
              title: "New comment",
              description: `${commentProfileMap.get(c.user_id) || "Someone"} commented on "${postTitleMap.get(c.post_id) || "your post"}"`,
              timestamp: c.created_at,
              isRead: true,
              link: "/social?tab=forum",
              icon: "comment",
            });
          });
        }
      }

      items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setNotifications(items);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (open) fetchNotifications();
  }, [open, fetchNotifications]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkMentionsRead = async () => {
    if (!user) return;
    await supabase
      .from("mention_notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);
    fetchNotifications();
  };

  const handleItemClick = (item: NotificationItem) => {
    setOpen(false);
    if (item.link) navigate(item.link);
  };

  const getIcon = (icon: NotificationItem["icon"]) => {
    switch (icon) {
      case "friend": return <UserPlus className="h-4 w-4 text-blue-500" />;
      case "like": return <Heart className="h-4 w-4 text-red-500" />;
      case "comment": return <MessageSquare className="h-4 w-4 text-amber-500" />;
      case "mention": return <AtSign className="h-4 w-4 text-purple-500" />;
    }
  };

  const hasNotifications = unreadCount > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "relative h-9 w-9 rounded-full transition-all duration-300",
            hasNotifications
              ? "bg-accent/20 hover:bg-accent/30"
              : "hover:bg-surfaceMuted"
          )}
        >
          <Bell className={cn("h-5 w-5", hasNotifications ? "text-accent" : "text-textMuted")} />
          {hasNotifications && (
            <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground shadow-sm ring-2 ring-background">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end" sideOffset={8}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-borderSubtle">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={handleMarkMentionsRead}>
              Mark all read
            </Button>
          )}
        </div>

        <ScrollArea className="max-h-[400px]">
          {loading && notifications.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-accent" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-8 text-center">
              <Bell className="h-8 w-8 text-textMuted mx-auto mb-2 opacity-40" />
              <p className="text-sm text-textMuted">No notifications yet</p>
            </div>
          ) : (
            <div>
              {notifications.map((item, idx) => (
                <div key={item.id}>
                  <button
                    onClick={() => handleItemClick(item)}
                    className={cn(
                      "w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-muted/50 transition-colors",
                      !item.isRead && "bg-accent/5"
                    )}
                  >
                    <div className="mt-0.5 shrink-0 h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                      {getIcon(item.icon)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={cn("text-xs font-medium truncate", !item.isRead && "text-foreground")}>
                          {item.title}
                        </p>
                        {!item.isRead && <span className="h-1.5 w-1.5 rounded-full bg-accent shrink-0" />}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.description}</p>
                      <p className="text-[10px] text-muted-foreground/70 mt-1">
                        {formatDistanceToNow(parseISO(item.timestamp), { addSuffix: true })}
                      </p>
                    </div>
                  </button>
                  {idx < notifications.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="border-t border-borderSubtle px-4 py-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-accent"
            onClick={() => { setOpen(false); navigate("/social"); }}
          >
            View all activity
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
