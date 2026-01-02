import { useState } from "react";
import { MessageCircle, Users, Bell } from "lucide-react";
import { useMessaging, Conversation } from "@/hooks/useMessaging";
import { ConversationList } from "@/components/messaging/ConversationList";
import { ChatWindow } from "@/components/messaging/ChatWindow";
import { FriendRequestsList } from "@/components/messaging/FriendRequestsList";
import { TradeNotificationsList } from "@/components/messaging/TradeNotificationsList";
import { AddFriendDialog } from "@/components/messaging/AddFriendDialog";
import { FriendsList } from "@/components/messaging/FriendsList";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function Messages() {
  const {
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
  } = useMessaging();

  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [activeTab, setActiveTab] = useState("chats");

  const totalNotifications = friendRequests.length + tradeNotifications.length;
  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);

  const handleAcceptRequest = async (requestId: string) => {
    const result = await acceptFriendRequest(requestId);
    if (result.success) {
      toast.success("Friend request accepted!");
    } else {
      toast.error(result.error || "Failed to accept request");
    }
    return result;
  };

  const handleDeclineRequest = async (requestId: string) => {
    const result = await declineFriendRequest(requestId);
    if (result.success) {
      toast.info("Friend request declined");
    } else {
      toast.error(result.error || "Failed to decline request");
    }
    return result;
  };

  const handleRemoveFriend = async (friendId: string) => {
    const result = await removeFriend(friendId);
    if (result.success) {
      toast.success("Friend removed");
      if (selectedConversation && 
          (selectedConversation.user1_id === friendId || selectedConversation.user2_id === friendId)) {
        setSelectedConversation(null);
      }
    } else {
      toast.error(result.error || "Failed to remove friend");
    }
    return result;
  };

  const handleStartChat = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setActiveTab("chats");
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-180px)]">
          <Skeleton className="h-full" />
          <Skeleton className="lg:col-span-2 h-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-textMain">Messages</h1>
          <p className="text-sm text-textMuted">Chat with friends and discover trade opportunities</p>
        </div>
        <AddFriendDialog onSendRequest={sendFriendRequest} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-220px)]">
        {/* Sidebar */}
        <Card className="overflow-hidden flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
            <TabsList className="w-full grid grid-cols-3 rounded-none border-b border-borderSubtle">
              <TabsTrigger value="chats" className="relative">
                <MessageCircle className="h-4 w-4 mr-1" />
                Chats
                {totalUnread > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center text-xs p-0">
                    {totalUnread}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="friends">
                <Users className="h-4 w-4 mr-1" />
                Friends
              </TabsTrigger>
              <TabsTrigger value="notifications" className="relative">
                <Bell className="h-4 w-4 mr-1" />
                Alerts
                {totalNotifications > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center text-xs p-0">
                    {totalNotifications}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="chats" className="flex-1 overflow-y-auto m-0">
              <ConversationList
                conversations={conversations}
                selectedId={selectedConversation?.id || null}
                onSelect={setSelectedConversation}
              />
            </TabsContent>

            <TabsContent value="friends" className="flex-1 overflow-y-auto m-0 p-3">
              <FriendsList
                friends={friends}
                conversations={conversations}
                onRemove={handleRemoveFriend}
                onStartChat={handleStartChat}
              />
            </TabsContent>

            <TabsContent value="notifications" className="flex-1 overflow-y-auto m-0 p-3 space-y-4">
              <TradeNotificationsList
                notifications={tradeNotifications}
                onDismiss={dismissTradeNotification}
                onSendFriendRequestById={sendFriendRequestById}
              />
              <FriendRequestsList
                requests={friendRequests}
                onAccept={handleAcceptRequest}
                onDecline={handleDeclineRequest}
              />
              {totalNotifications === 0 && (
                <div className="text-center text-textMuted py-8">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No notifications</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </Card>

        {/* Chat Area */}
        <Card className="lg:col-span-2 overflow-hidden">
          <ChatWindow
            conversation={selectedConversation}
            onSendMessage={sendMessage}
            onMarkAsRead={markMessagesAsRead}
          />
        </Card>
      </div>
    </div>
  );
}
