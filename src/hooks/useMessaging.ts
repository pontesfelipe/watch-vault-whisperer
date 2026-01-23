import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Friend {
  id: string;
  friend_id: string;
  friend_email: string;
  friend_name: string;
  created_at: string;
}

export interface FriendRequest {
  id: string;
  from_user_id: string;
  to_user_id: string;
  status: 'pending' | 'accepted' | 'declined';
  message: string | null;
  trade_match_watch_id: string | null;
  created_at: string;
  from_user_email?: string;
  from_user_name?: string;
}

export interface Conversation {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
  updated_at: string;
  other_user_email?: string;
  other_user_name?: string;
  last_message?: string;
  unread_count?: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

export interface TradeMatchNotification {
  id: string;
  user_id: string;
  wishlist_item_id: string;
  trade_watch_id: string;
  trade_owner_id: string;
  is_read: boolean;
  is_dismissed: boolean;
  created_at: string;
  watch_brand?: string;
  watch_model?: string;
  watch_dial_color?: string;
  watch_type?: string;
  owner_email?: string;
  owner_username?: string;
  owner_location?: string;
}

export const useMessaging = () => {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [tradeNotifications, setTradeNotifications] = useState<TradeMatchNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFriends = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await (supabase
      .from('friendships' as any) as any)
      .select('id, friend_id, created_at')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching friends:', error);
      return;
    }

    // Fetch profile info for each friend (only non-sensitive data)
    const friendsWithProfiles = await Promise.all(
      (data || []).map(async (f: any) => {
        const { data: profile } = await supabase
          .from('public_profiles')
          .select('username, avatar_url, avatar_color')
          .eq('id', f.friend_id)
          .single();
        
        return {
          ...f,
          friend_email: '', // No longer exposed for privacy
          friend_name: profile?.username || 'User',
          friend_avatar_url: profile?.avatar_url,
          friend_avatar_color: profile?.avatar_color,
        };
      })
    );

    setFriends(friendsWithProfiles);
  }, [user]);

  const fetchFriendRequests = useCallback(async () => {
    if (!user) return;

    const { data, error } = await (supabase
      .from('friend_requests' as any) as any)
      .select('*')
      .eq('to_user_id', user.id)
      .eq('status', 'pending');

    if (error) {
      console.error('Error fetching friend requests:', error);
      return;
    }

    // Fetch profile info for each requester (only non-sensitive data)
    const requestsWithProfiles = await Promise.all(
      (data || []).map(async (r: any) => {
        const { data: profile } = await supabase
          .from('public_profiles')
          .select('username, avatar_url, avatar_color')
          .eq('id', r.from_user_id)
          .single();
        
        return {
          ...r,
          from_user_email: '', // No longer exposed for privacy
          from_user_name: profile?.username || 'User',
          from_user_avatar_url: profile?.avatar_url,
          from_user_avatar_color: profile?.avatar_color,
        };
      })
    );

    setFriendRequests(requestsWithProfiles);
  }, [user]);

  const fetchConversations = useCallback(async () => {
    if (!user) return;

    const { data, error } = await (supabase
      .from('conversations' as any) as any)
      .select('*')
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching conversations:', error);
      return;
    }

    // Fetch profile info and last message for each conversation (only non-sensitive data)
    const conversationsWithDetails = await Promise.all(
      (data || []).map(async (c: any) => {
        const otherUserId = c.user1_id === user.id ? c.user2_id : c.user1_id;
        
        const { data: profile } = await supabase
          .from('public_profiles')
          .select('username, avatar_url, avatar_color')
          .eq('id', otherUserId)
          .single();

        // Get last message
        const { data: messages } = await (supabase
          .from('messages' as any) as any)
          .select('content, created_at, read_at, sender_id')
          .eq('conversation_id', c.id)
          .order('created_at', { ascending: false })
          .limit(1);

        // Count unread messages
        const { count } = await (supabase
          .from('messages' as any) as any)
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', c.id)
          .neq('sender_id', user.id)
          .is('read_at', null);

        return {
          ...c,
          other_user_email: '', // No longer exposed for privacy
          other_user_name: profile?.username || 'User',
          other_user_avatar_url: profile?.avatar_url,
          other_user_avatar_color: profile?.avatar_color,
          last_message: messages?.[0]?.content || '',
          unread_count: count || 0,
        };
      })
    );

    setConversations(conversationsWithDetails);
  }, [user]);

  const fetchTradeNotifications = useCallback(async () => {
    if (!user) return;

    const { data, error } = await (supabase
      .from('trade_match_notifications' as any) as any)
      .select('*')
      .eq('user_id', user.id)
      .eq('is_dismissed', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching trade notifications:', error);
      return;
    }

    // Fetch watch info only - owner info is restricted until friendship is established
    const notificationsWithDetails = await Promise.all(
      (data || []).map(async (n: any) => {
        const { data: watch } = await supabase
          .from('watches')
          .select('brand, model, dial_color, type')
          .eq('id', n.trade_watch_id)
          .single();

        // Owner profile info is not accessible until they become friends
        // This is by design for privacy - trade_owner_id is stored for friend request flow
        return {
          ...n,
          watch_brand: watch?.brand || '',
          watch_model: watch?.model || '',
          watch_dial_color: watch?.dial_color || '',
          watch_type: watch?.type || '',
          trade_owner_id: n.trade_owner_id, // Keep for friend request flow
        };
      })
    );

    setTradeNotifications(notificationsWithDetails);
  }, [user]);

  const sendFriendRequest = async (email: string, message?: string) => {
    if (!user) return { error: 'Not authenticated' };

    console.log('sendFriendRequest called with email:', email);

    // Use secure RPC function to find user by exact email match
    // This prevents enumeration of all profiles
    const { data: targetUserId, error: lookupError } = await supabase
      .rpc('get_profile_id_by_email', { _email: email.trim() });

    console.log('Profile lookup result:', { targetUserId, lookupError });

    if (lookupError) {
      console.error('Profile lookup error:', lookupError);
      return { error: 'Error finding user' };
    }

    if (!targetUserId) {
      return { error: 'User not found with that email' };
    }

    if (targetUserId === user.id) {
      return { error: 'You cannot send a friend request to yourself' };
    }

    const targetUser = { id: targetUserId };

    // Check if already friends
    const { data: existing } = await (supabase
      .from('friendships' as any) as any)
      .select('id')
      .eq('user_id', user.id)
      .eq('friend_id', targetUser.id)
      .single();

    if (existing) {
      return { error: 'You are already friends with this user' };
    }

    // Check if request already exists
    const { data: existingRequest } = await (supabase
      .from('friend_requests' as any) as any)
      .select('id, status')
      .eq('from_user_id', user.id)
      .eq('to_user_id', targetUser.id)
      .single();

    if (existingRequest) {
      if (existingRequest.status === 'pending') {
        return { error: 'Friend request already sent' };
      }
    }

    console.log('Inserting friend request:', {
      from_user_id: user.id,
      to_user_id: targetUser.id,
      message: message || null,
    });

    const { error, data } = await (supabase
      .from('friend_requests' as any) as any)
      .insert({
        from_user_id: user.id,
        to_user_id: targetUser.id,
        message: message || null,
      })
      .select();

    if (error) {
      console.error('Error sending friend request:', error);
      return { error: 'Failed to send friend request: ' + error.message };
    }

    console.log('Friend request created:', data);
    return { success: true };
  };

  // Send friend request by user ID (used for trade notifications where we don't have access to email)
  const sendFriendRequestById = async (targetUserId: string, message?: string) => {
    if (!user) return { error: 'Not authenticated' };

    if (targetUserId === user.id) {
      return { error: 'You cannot send a friend request to yourself' };
    }

    // Check if already friends
    const { data: existing } = await (supabase
      .from('friendships' as any) as any)
      .select('id')
      .eq('user_id', user.id)
      .eq('friend_id', targetUserId)
      .single();

    if (existing) {
      return { error: 'You are already friends with this user' };
    }

    // Check if request already exists
    const { data: existingRequest } = await (supabase
      .from('friend_requests' as any) as any)
      .select('id, status')
      .eq('from_user_id', user.id)
      .eq('to_user_id', targetUserId)
      .single();

    if (existingRequest) {
      if (existingRequest.status === 'pending') {
        return { error: 'Friend request already sent' };
      }
    }

    const { data, error } = await (supabase
      .from('friend_requests' as any) as any)
      .insert({
        from_user_id: user.id,
        to_user_id: targetUserId,
        message: message || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error sending friend request:', error);
      return { error: 'Failed to send friend request: ' + error.message };
    }

    console.log('Friend request created by ID:', data);
    return { success: true };
  };

  const acceptFriendRequest = async (requestId: string) => {
    const { error } = await supabase.rpc('accept_friend_request', { _request_id: requestId });
    
    if (error) {
      console.error('Error accepting friend request:', error);
      return { error: 'Failed to accept friend request' };
    }

    await fetchFriendRequests();
    await fetchFriends();
    await fetchConversations();
    return { success: true };
  };

  const declineFriendRequest = async (requestId: string) => {
    const { error } = await (supabase
      .from('friend_requests' as any) as any)
      .update({ status: 'declined' })
      .eq('id', requestId);

    if (error) {
      console.error('Error declining friend request:', error);
      return { error: 'Failed to decline friend request' };
    }

    await fetchFriendRequests();
    return { success: true };
  };

  const sendMessage = async (conversationId: string, content: string) => {
    if (!user) return { error: 'Not authenticated' };

    const { error } = await (supabase
      .from('messages' as any) as any)
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content,
      });

    if (error) {
      console.error('Error sending message:', error);
      return { error: 'Failed to send message' };
    }

    // Update conversation updated_at
    await (supabase
      .from('conversations' as any) as any)
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    return { success: true };
  };

  const markMessagesAsRead = async (conversationId: string) => {
    if (!user) return;

    // NOTE: Receivers cannot update messages due to RLS (only senders can UPDATE).
    // We use a secure backend RPC to mark messages as read for the current user.
    const { error } = await supabase.rpc('mark_messages_as_read', {
      _conversation_id: conversationId,
    });

    if (error) {
      console.error('Error marking messages as read:', error);
      return;
    }

    // Optimistic UI: clear unread badge immediately.
    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? { ...c, unread_count: 0 } : c))
    );

    // Trigger global event to refresh social notification counts immediately.
    window.dispatchEvent(new CustomEvent('social-notifications-refresh'));

    // Refetch conversations to keep last_message + ordering accurate.
    await fetchConversations();
  };

  const dismissTradeNotification = async (notificationId: string) => {
    await (supabase
      .from('trade_match_notifications' as any) as any)
      .update({ is_dismissed: true })
      .eq('id', notificationId);
    
    await fetchTradeNotifications();
  };

  const removeFriend = async (friendId: string) => {
    if (!user) return { error: 'Not authenticated' };

    // Delete both directions of friendship
    await (supabase
      .from('friendships' as any) as any)
      .delete()
      .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`);

    await fetchFriends();
    return { success: true };
  };

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      await Promise.all([
        fetchFriends(),
        fetchFriendRequests(),
        fetchConversations(),
        fetchTradeNotifications(),
      ]);
      setLoading(false);
    };

    if (user) {
      fetchAll();
    }
  }, [user, fetchFriends, fetchFriendRequests, fetchConversations, fetchTradeNotifications]);

  // Set up realtime subscriptions
  useEffect(() => {
    if (!user) return;

    const friendRequestsChannel = supabase
      .channel('friend_requests_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friend_requests',
          filter: `to_user_id=eq.${user.id}`,
        },
        () => {
          fetchFriendRequests();
        }
      )
      .subscribe();

    const tradeNotificationsChannel = supabase
      .channel('trade_notifications_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trade_match_notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchTradeNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(friendRequestsChannel);
      supabase.removeChannel(tradeNotificationsChannel);
    };
  }, [user, fetchFriendRequests, fetchTradeNotifications]);

  return {
    friends,
    friendRequests,
    conversations,
    tradeNotifications,
    loading,
    sendFriendRequest,
    sendFriendRequestById,
    acceptFriendRequest,
    declineFriendRequest,
    sendMessage,
    markMessagesAsRead,
    dismissTradeNotification,
    removeFriend,
    refetch: {
      friends: fetchFriends,
      friendRequests: fetchFriendRequests,
      conversations: fetchConversations,
      tradeNotifications: fetchTradeNotifications,
    },
  };
};
