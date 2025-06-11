
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatHistory {
  id: string;
  client_id: string;
  chat_name: string;
  created_at: string;
  updated_at: string;
  messages: Message[];
}

export const useChatHistory = (clientId?: string) => {
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchChatHistory = async () => {
    if (!user || !clientId) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('chat_history')
        .select('id, client_id, chat_name, created_at, updated_at, messages')
        .eq('client_id', clientId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const parsedData = data?.map(chat => ({
        ...chat,
        messages: Array.isArray(chat.messages) ? chat.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })) : []
      })) || [];
      
      setChatHistory(parsedData);
    } catch (error) {
      console.error('Error fetching chat history:', error);
      toast({
        title: "Error",
        description: "Failed to load chat history",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createNewChat = async (chatName: string) => {
    if (!user || !clientId) return null;

    try {
      const { data, error } = await supabase
        .from('chat_history')
        .insert({
          client_id: clientId,
          user_id: user.id,
          chat_name: chatName,
          messages: []
        })
        .select()
        .single();

      if (error) throw error;
      
      await fetchChatHistory();
      return data;
    } catch (error) {
      console.error('Error creating new chat:', error);
      toast({
        title: "Error",
        description: "Failed to create new chat",
        variant: "destructive"
      });
      return null;
    }
  };

  const deleteChat = async (chatId: string) => {
    if (!user || !clientId) return false;

    try {
      const { error } = await supabase
        .from('chat_history')
        .delete()
        .eq('id', chatId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      await fetchChatHistory();
      toast({
        title: "Success",
        description: "Chat deleted successfully"
      });
      return true;
    } catch (error) {
      console.error('Error deleting chat:', error);
      toast({
        title: "Error",
        description: "Failed to delete chat",
        variant: "destructive"
      });
      return false;
    }
  };

  const saveMessageToChat = async (chatId: string, message: Message) => {
    if (!user || !clientId) return false;

    try {
      // First get current messages
      const { data: currentChat, error: fetchError } = await supabase
        .from('chat_history')
        .select('messages')
        .eq('id', chatId)
        .eq('user_id', user.id)
        .single();

      if (fetchError) throw fetchError;

      const currentMessages = Array.isArray(currentChat.messages) ? currentChat.messages : [];
      const updatedMessages = [...currentMessages, {
        ...message,
        timestamp: message.timestamp.toISOString()
      }];

      const { error } = await supabase
        .from('chat_history')
        .update({ 
          messages: updatedMessages,
          updated_at: new Date().toISOString()
        })
        .eq('id', chatId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      await fetchChatHistory();
      return true;
    } catch (error) {
      console.error('Error saving message:', error);
      toast({
        title: "Error",
        description: "Failed to save message",
        variant: "destructive"
      });
      return false;
    }
  };

  const getChatMessages = (chatId: string): Message[] => {
    const chat = chatHistory.find(c => c.id === chatId);
    return chat?.messages || [];
  };

  useEffect(() => {
    fetchChatHistory();
  }, [user, clientId]);

  return {
    chatHistory,
    isLoading,
    fetchChatHistory,
    createNewChat,
    deleteChat,
    saveMessageToChat,
    getChatMessages
  };
};
