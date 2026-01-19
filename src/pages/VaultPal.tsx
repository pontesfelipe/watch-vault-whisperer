import { useState, useRef, useEffect } from "react";
import { Send, Trash2, Bot, Sparkles, Loader2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useVaultPalChat, ChatMessage } from "@/hooks/useVaultPalChat";
import { useCollection } from "@/contexts/CollectionContext";
import { CollectionSwitcher } from "@/components/CollectionSwitcher";
import { getItemLabel } from "@/types/collection";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const VaultPal = () => {
  const { messages, isLoading, sendMessage, clearChat } = useVaultPalChat();
  const { currentCollection, currentCollectionType } = useCollection();
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const [collectionInsights, setCollectionInsights] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
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
    <div className="flex flex-col h-[calc(100vh-4rem)] max-h-[calc(100vh-4rem)]">
      {/* Header with Collection Insights */}
      <div className="shrink-0 border-b border-borderSubtle bg-surface px-4 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
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
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearChat}
                className="text-textMuted hover:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Clear
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
