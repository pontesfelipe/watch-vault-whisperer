import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useSocialNotifications = () => {
  const { user } = useAuth();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [tradeNotifications, setTradeNotifications] = useState(0);

  const fetchCounts = useCallback(async () => {
    if (!user) return;

    // Fetch unread messages count
    try {
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('id, user1_id, user2_id')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

      if (convError) throw convError;

      const convs = conversations ?? [];
      const counts = await Promise.all(
        convs.map((conv) =>
          supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .neq('sender_id', user.id)
            .is('read_at', null)
        )
      );

      const totalUnread = counts.reduce((sum, r) => sum + (r.count || 0), 0);
      setUnreadMessages(totalUnread);
    } catch (e) {
      console.error('Error fetching unread messages count:', e);
      setUnreadMessages(0);
    }

    // Fetch pending friend requests count
    try {
      const { count: requestCount, error: requestError } = await supabase
        .from('friend_requests')
        .select('*', { count: 'exact', head: true })
        .eq('to_user_id', user.id)
        .eq('status', 'pending');

      if (requestError) throw requestError;
      setPendingRequests(requestCount || 0);
    } catch (e) {
      console.error('Error fetching pending friend requests count:', e);
      setPendingRequests(0);
    }

    // Fetch trade notifications count
    try {
      const { count: tradeCount, error: tradeError } = await supabase
        .from('trade_match_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_dismissed', false);

      if (tradeError) throw tradeError;
      setTradeNotifications(tradeCount || 0);
    } catch (e) {
      console.error('Error fetching trade notifications count:', e);
      setTradeNotifications(0);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setUnreadMessages(0);
      setPendingRequests(0);
      setTradeNotifications(0);
      return;
    }

    fetchCounts();

    // Subscribe to realtime updates for messages
    const messagesChannel = supabase
      .channel('social-notifications-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        () => fetchCounts()
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
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
  }, [user, fetchCounts]);

  const totalCount = unreadMessages + pendingRequests + tradeNotifications;

  return {
    unreadMessages,
    pendingRequests,
    tradeNotifications,
    totalCount,
    refetch: fetchCounts,
  };
};
