import { useState, useCallback, useEffect } from "react";
import { useCollection } from "@/contexts/CollectionContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface Conversation {
  id: string;
  title: string;
  collection_type: string | null;
  created_at: string;
  updated_at: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/vault-pal-chat`;

export const useVaultPalChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const { currentCollection, currentCollectionType } = useCollection();
  const { user } = useAuth();

  // Load conversations list
  const loadConversations = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("vault_pal_conversations" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      const convs = (data as any[])?.map(d => d as Conversation) || [];
      setConversations(convs);
      setFilteredConversations(convs);
    } catch (error) {
      console.error("Error loading conversations:", error);
    } finally {
      setIsLoadingConversations(false);
    }
  }, [user]);

  // Search conversations by title and message content
  const searchConversations = useCallback(async (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setFilteredConversations(conversations);
      return;
    }

    setIsSearching(true);
    const lowerQuery = query.toLowerCase().trim();

    try {
      // First filter by title
      const titleMatches = conversations.filter(conv => 
        conv.title.toLowerCase().includes(lowerQuery)
      );

      // Then search in message content
      const { data: messageMatches, error } = await supabase
        .from("vault_pal_messages" as any)
        .select("conversation_id, content")
        .eq("user_id", user?.id)
        .ilike("content", `%${lowerQuery}%`);

      if (error) throw error;

      // Get unique conversation IDs from message matches
      const messageConvIds = new Set(
        (messageMatches as any[])?.map(m => m.conversation_id) || []
      );

      // Combine results, prioritizing title matches
      const combinedIds = new Set([
        ...titleMatches.map(c => c.id),
        ...messageConvIds,
      ]);

      const results = conversations.filter(conv => combinedIds.has(conv.id));
      setFilteredConversations(results);
    } catch (error) {
      console.error("Error searching conversations:", error);
      // Fallback to title-only search
      setFilteredConversations(
        conversations.filter(conv => 
          conv.title.toLowerCase().includes(lowerQuery)
        )
      );
    } finally {
      setIsSearching(false);
    }
  }, [conversations, user]);

  // Load messages for a conversation
  const loadConversation = useCallback(async (conversationId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("vault_pal_messages" as any)
        .select("role, content")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      
      setMessages((data as any[])?.map(d => ({ role: d.role, content: d.content } as ChatMessage)) || []);
      setCurrentConversationId(conversationId);
    } catch (error) {
      console.error("Error loading conversation:", error);
      toast.error("Failed to load conversation");
    }
  }, [user]);

  // Create a new conversation
  const createConversation = useCallback(async (firstMessage: string): Promise<string | null> => {
    if (!user) return null;

    try {
      // Generate a title from the first message (first 50 chars)
      const title = firstMessage.length > 50 
        ? firstMessage.substring(0, 50) + "..." 
        : firstMessage;

      const { data, error } = await supabase
        .from("vault_pal_conversations" as any)
        .insert({
          user_id: user.id,
          title,
          collection_type: currentCollectionType,
        })
        .select("id")
        .single();

      if (error) throw error;
      
      const newId = (data as any).id;
      await loadConversations();
      return newId;
    } catch (error) {
      console.error("Error creating conversation:", error);
      return null;
    }
  }, [user, currentCollectionType, loadConversations]);

  // Save a message to the database
  const saveMessage = useCallback(async (conversationId: string, role: "user" | "assistant", content: string) => {
    try {
      await supabase
        .from("vault_pal_messages" as any)
        .insert({
          conversation_id: conversationId,
          role,
          content,
        });
    } catch (error) {
      console.error("Error saving message:", error);
    }
  }, []);

  // Update conversation title
  const updateConversationTitle = useCallback(async (conversationId: string, title: string) => {
    try {
      await supabase
        .from("vault_pal_conversations" as any)
        .update({ title })
        .eq("id", conversationId);
      
      await loadConversations();
    } catch (error) {
      console.error("Error updating title:", error);
    }
  }, [loadConversations]);

  // Delete a conversation
  const deleteConversation = useCallback(async (conversationId: string) => {
    if (!user) {
      toast.error("You must be logged in to delete chats");
      return;
    }

    console.log("[VaultPal] deleteConversation() start", { conversationId, userId: user.id });

    try {
      const { data, error } = await supabase
        .from("vault_pal_conversations" as any)
        .delete()
        .eq("id", conversationId)
        .eq("user_id", user.id)
        .select("id");

      if (error) throw error;

      const deletedCount = Array.isArray(data) ? data.length : 0;
      console.log("[VaultPal] deleteConversation() result", { deletedCount, data });

      if (deletedCount === 0) {
        toast.error("Couldn't delete: no permission or chat not found");
        return;
      }

      if (currentConversationId === conversationId) {
        setMessages([]);
        setCurrentConversationId(null);
      }

      await loadConversations();
      toast.success("Conversation deleted");
    } catch (error: any) {
      console.error("[VaultPal] Error deleting conversation:", error);
      toast.error(error?.message ? `Failed to delete: ${error.message}` : "Failed to delete conversation");
    }
  }, [currentConversationId, loadConversations, user]);

  // Send a message
  const sendMessage = useCallback(async (input: string) => {
    if (!input.trim() || !user) return;

    const userMessage: ChatMessage = { role: "user", content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    let conversationId = currentConversationId;
    
    // Create new conversation if needed
    if (!conversationId) {
      conversationId = await createConversation(input.trim());
      if (!conversationId) {
        setIsLoading(false);
        toast.error("Failed to create conversation");
        return;
      }
      setCurrentConversationId(conversationId);
    }

    // Save user message
    await saveMessage(conversationId, "user", input.trim());

    let assistantContent = "";
    
    const updateAssistant = (chunk: string) => {
      assistantContent += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => 
            i === prev.length - 1 ? { ...m, content: assistantContent } : m
          );
        }
        return [...prev, { role: "assistant", content: assistantContent }];
      });
    };

    try {
      // Get user session token for authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("No active session");
      }

      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          collectionId: currentCollection?.id,
          collectionType: currentCollectionType,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 429) {
          toast.error("Rate limit exceeded. Please wait a moment and try again.");
          throw new Error("Rate limited");
        }
        if (response.status === 402) {
          toast.error("AI credits exhausted. Please add credits to continue.");
          throw new Error("Credits exhausted");
        }
        throw new Error(errorData.error || "Failed to get response");
      }

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) updateAssistant(content);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) updateAssistant(content);
          } catch {
            /* ignore */
          }
        }
      }

      // Save assistant message after streaming completes
      if (assistantContent) {
        await saveMessage(conversationId, "assistant", assistantContent);
        await loadConversations(); // Refresh to update timestamps
      }

    } catch (error) {
      console.error("Chat error:", error);
      if (assistantContent === "") {
        setMessages(prev => prev.slice(0, -1));
      }
      if (error instanceof Error && !["Rate limited", "Credits exhausted"].includes(error.message)) {
        toast.error("Failed to send message. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [messages, currentCollection, currentCollectionType, currentConversationId, user, createConversation, saveMessage, loadConversations]);

  // Start a new chat
  const startNewChat = useCallback(() => {
    setMessages([]);
    setCurrentConversationId(null);
  }, []);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  return {
    messages,
    conversations: filteredConversations,
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
  };
};
