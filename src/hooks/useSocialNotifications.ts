import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useSocialNotifications = () => {
  const { user } = useAuth();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [tradeNotifications, setTradeNotifications] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnreadMessages(0);
      setPendingRequests(0);
      setTradeNotifications(0);
      return;
    }

    const fetchCounts = async () => {
      // Fetch unread messages count
      const { data: conversations } = await supabase
        .from('conversations')
        .select('id, user1_id, user2_id')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

      if (conversations) {
        let totalUnread = 0;
        for (const conv of conversations) {
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .neq('sender_id', user.id)
            .is('read_at', null);
          totalUnread += count || 0;
        }
        setUnreadMessages(totalUnread);
      }

      // Fetch pending friend requests count
      const { count: requestCount } = await supabase
        .from('friend_requests')
        .select('*', { count: 'exact', head: true })
        .eq('to_user_id', user.id)
        .eq('status', 'pending');
      setPendingRequests(requestCount || 0);

      // Fetch trade notifications count
      const { count: tradeCount } = await supabase
        .from('trade_match_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_dismissed', false);
      setTradeNotifications(tradeCount || 0);
    };

    fetchCounts();

    // Subscribe to realtime updates for messages
    const messagesChannel = supabase
      .channel('social-notifications-messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        () => fetchCounts()
      )
      .subscribe();

    // Subscribe to friend requests
    const requestsChannel = supabase
      .channel('social-notifications-requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friend_requests',
          filter: `to_user_id=eq.${user.id}`,
        },
        () => fetchCounts()
      )
      .subscribe();

    // Subscribe to trade notifications
    const tradeChannel = supabase
      .channel('social-notifications-trade')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trade_match_notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => fetchCounts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(requestsChannel);
      supabase.removeChannel(tradeChannel);
    };
  }, [user]);

  const totalCount = unreadMessages + pendingRequests + tradeNotifications;

  return {
    unreadMessages,
    pendingRequests,
    tradeNotifications,
    totalCount,
  };
};
