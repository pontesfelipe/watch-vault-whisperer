import { useState, useRef, useEffect } from "react";
import { Send, Trash2, Bot, Sparkles, Loader2, User, Plus, MessageSquare, MoreVertical, Pencil, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useVaultPalChat, ChatMessage, Conversation } from "@/hooks/useVaultPalChat";
import { useCollection } from "@/contexts/CollectionContext";
import { CollectionSwitcher } from "@/components/CollectionSwitcher";
import { getItemLabel } from "@/types/collection";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useIsMobile } from "@/hooks/use-mobile";

const VaultPal = () => {
  const {
    messages,
    conversations,
    currentConversationId,
    isLoading,
    isLoadingConversations,
    isSearching,
    searchQuery,
    sendMessage,
    loadConversation,
    startNewChat,
    deleteConversation,
    updateConversationTitle,
    searchConversations,
  } = useVaultPalChat();
  const { currentCollection, currentCollectionType } = useCollection();
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const [collectionInsights, setCollectionInsights] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isMobile = useIsMobile();

  const itemLabel = currentCollectionType ? getItemLabel(currentCollectionType, true) : "items";

  // Load collection insights
  useEffect(() => {
    const loadInsights = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("collection_insights")
        .select("insights")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (data?.insights) {
        setCollectionInsights(data.insights);
      }
    };
    loadInsights();
  }, [user]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(input);
    setInput("");
    setShowHistory(false);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleEditTitle = (conversationId: string, currentTitle: string) => {
    setEditingTitle(conversationId);
    setNewTitle(currentTitle);
  };

  const handleSaveTitle = async () => {
    if (editingTitle && newTitle.trim()) {
      await updateConversationTitle(editingTitle, newTitle.trim());
      setEditingTitle(null);
      setNewTitle("");
    }
  };

  const suggestedQuestions = [
    `What's my most worn ${itemLabel.slice(0, -1)}?`,
    "What patterns do you see in my collection?",
    "What should I add next?",
    "Tell me about my collecting style",
    `Which ${itemLabel} have I not worn recently?`,
  ];

  return (
    <div className="flex h-[calc(100vh-4rem)] max-h-[calc(100vh-4rem)]">
      {/* Conversation History Sidebar - Desktop */}
      {!isMobile && (
        <div className="w-64 shrink-0 border-r border-borderSubtle bg-surfaceMuted flex flex-col">
          <div className="p-3 border-b border-borderSubtle space-y-2">
            <Button
              onClick={startNewChat}
              className="w-full gap-2"
              size="sm"
            >
              <Plus className="w-4 h-4" />
              New Chat
            </Button>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-textMuted" />
              <Input
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => searchConversations(e.target.value)}
                className="pl-8 pr-8 h-8 text-sm"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                  onClick={() => searchConversations("")}
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {isLoadingConversations || isSearching ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-textMuted" />
                </div>
              ) : conversations.length === 0 ? (
                <p className="text-xs text-textMuted text-center py-8 px-4">
                  {searchQuery ? "No matching conversations found" : "No conversations yet. Start chatting!"}
                </p>
              ) : (
                conversations.map((conv) => (
                  <ConversationItem
                    key={conv.id}
                    conversation={conv}
                    isActive={conv.id === currentConversationId}
                    onSelect={() => loadConversation(conv.id)}
                    onDelete={() => deleteConversation(conv.id)}
                    onEdit={() => handleEditTitle(conv.id, conv.title)}
                    searchQuery={searchQuery}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header with Collection Insights */}
        <div className="shrink-0 border-b border-borderSubtle bg-surface px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              {isMobile && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowHistory(!showHistory)}
                  className="shrink-0"
                >
                  <MessageSquare className="w-5 h-5" />
                </Button>
              )}
              <div className="p-2.5 rounded-xl bg-accent/10">
                <Bot className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-textMain">My Vault Pal</h1>
                <p className="text-xs text-textMuted">Your personal collection expert</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CollectionSwitcher />
              {!isMobile && currentConversationId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={startNewChat}
                  className="text-textMuted"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  New
                </Button>
              )}
            </div>
          </div>

          {/* Collection Insights Header */}
          {collectionInsights && (
            <Card className="bg-accentSubtle/30 border-accent/20">
              <CardContent className="py-3 px-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                  <div className="text-sm text-textMuted leading-relaxed line-clamp-2">
                    {collectionInsights}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Mobile History Dropdown */}
        {isMobile && showHistory && (
          <div className="absolute inset-x-0 top-[180px] bottom-0 z-50 bg-background/95 backdrop-blur-sm">
            <div className="p-4 border-b border-borderSubtle space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Chat History</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowHistory(false)}>
                  Close
                </Button>
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-textMuted" />
                <Input
                  placeholder="Search chats..."
                  value={searchQuery}
                  onChange={(e) => searchConversations(e.target.value)}
                  className="pl-8 pr-8 h-9"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => searchConversations("")}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>
            <ScrollArea className="h-[calc(100%-120px)]">
              <div className="p-2 space-y-1">
                <Button
                  onClick={() => {
                    startNewChat();
                    searchConversations("");
                    setShowHistory(false);
                  }}
                  className="w-full gap-2 mb-2"
                  size="sm"
                >
                  <Plus className="w-4 h-4" />
                  New Chat
                </Button>
                {isSearching ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-textMuted" />
                  </div>
                ) : conversations.length === 0 ? (
                  <p className="text-xs text-textMuted text-center py-4">
                    {searchQuery ? "No matching conversations" : "No conversations yet"}
                  </p>
                ) : (
                  conversations.map((conv) => (
                    <ConversationItem
                      key={conv.id}
                      conversation={conv}
                      isActive={conv.id === currentConversationId}
                      onSelect={() => {
                        loadConversation(conv.id);
                        setShowHistory(false);
                      }}
                      onDelete={() => deleteConversation(conv.id)}
                      onEdit={() => handleEditTitle(conv.id, conv.title)}
                      searchQuery={searchQuery}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Chat Messages Area */}
        <ScrollArea className="flex-1 px-4" ref={scrollRef}>
          <div className="py-4 space-y-4 max-w-3xl mx-auto">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="p-4 rounded-2xl bg-accent/10 mb-4">
                  <Bot className="w-10 h-10 text-accent" />
                </div>
                <h2 className="text-lg font-medium text-textMain mb-2">
                  Welcome to My Vault Pal
                </h2>
                <p className="text-sm text-textMuted mb-6 max-w-md">
                  I'm your personal collection expert. I know everything about your {itemLabel.toLowerCase()}, 
                  wear patterns, trips, events, and preferences. Ask me anything!
                </p>
                <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                  {suggestedQuestions.map((question, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      size="sm"
                      onClick={() => sendMessage(question)}
                      className="text-xs"
                    >
                      {question}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message, idx) => (
                <MessageBubble key={idx} message={message} />
              ))
            )}
            
            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-accent/10 shrink-0">
                  <Bot className="w-4 h-4 text-accent" />
                </div>
                <div className="flex items-center gap-2 text-textMuted">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Thinking...</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="shrink-0 border-t border-borderSubtle bg-surface px-4 py-3">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
            <div className="flex gap-2">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Ask about your ${itemLabel.toLowerCase()}...`}
                className="min-h-[44px] max-h-[120px] resize-none"
                rows={1}
                disabled={isLoading}
              />
              <Button
                type="submit"
                disabled={!input.trim() || isLoading}
                size="icon"
                className="shrink-0 h-[44px] w-[44px]"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-textMuted mt-2 text-center">
              Press Enter to send, Shift+Enter for new line
            </p>
          </form>
        </div>
      </div>

      {/* Edit Title Dialog */}
      <Dialog open={!!editingTitle} onOpenChange={() => setEditingTitle(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Conversation</DialogTitle>
          </DialogHeader>
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Enter new title..."
            onKeyDown={(e) => e.key === "Enter" && handleSaveTitle()}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditingTitle(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTitle}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const ConversationItem = ({
  conversation,
  isActive,
  onSelect,
  onDelete,
  onEdit,
  searchQuery = "",
}: {
  conversation: Conversation;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onEdit: () => void;
  searchQuery?: string;
}) => {
  // Highlight matching text in title
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) => 
      regex.test(part) ? (
        <mark key={i} className="bg-accent/30 text-textMain rounded px-0.5">{part}</mark>
      ) : part
    );
  };

  return (
    <div
      className={`group flex items-center gap-2 rounded-lg px-3 py-2 cursor-pointer transition-colors ${
        isActive
          ? "bg-accent/10 text-textMain"
          : "text-textMuted hover:bg-surfaceMuted hover:text-textMain"
      }`}
      onClick={onSelect}
    >
      <MessageSquare className="w-4 h-4 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate">{highlightMatch(conversation.title, searchQuery)}</p>
        <p className="text-xs text-textMuted">
          {format(new Date(conversation.updated_at), "MMM d, h:mm a")}
        </p>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0"
          >
            <MoreVertical className="w-3 h-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-surface border-borderSubtle">
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
            <Pencil className="w-3 h-3 mr-2" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="w-3 h-3 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

const MessageBubble = ({ message }: { message: ChatMessage }) => {
  const isUser = message.role === "user";

  return (
    <div className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div className={`p-2 rounded-lg shrink-0 ${isUser ? "bg-primary/10" : "bg-accent/10"}`}>
        {isUser ? (
          <User className="w-4 h-4 text-primary" />
        ) : (
          <Bot className="w-4 h-4 text-accent" />
        )}
      </div>
      <div
        className={`flex-1 rounded-xl px-4 py-3 ${
          isUser
            ? "bg-primary text-primary-foreground ml-12"
            : "bg-muted text-textMain mr-12"
        }`}
      >
        <div className="text-sm whitespace-pre-wrap break-words leading-relaxed">
          {message.content.split("\n").map((line, i) => (
            <p key={i} className={i > 0 ? "mt-2" : ""}>
              {line}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VaultPal;
