
import React from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChatHistory } from '@/hooks/useChatHistory';
import { Plus, MessageSquare, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

interface ChatSidebarProps {
  clientId: string;
  currentChatId?: string;
  isOpen: boolean;
  onToggle: () => void;
}

const ChatSidebar = ({ clientId, currentChatId, isOpen, onToggle }: ChatSidebarProps) => {
  const { chatHistory, isLoading, createNewChat, deleteChat } = useChatHistory(clientId);
  const navigate = useNavigate();

  const handleNewChat = async () => {
    const chatName = `Chat ${new Date().toLocaleString()}`;
    const newChat = await createNewChat(chatName);
    if (newChat) {
      navigate(`/chat/${clientId}?chatId=${newChat.id}`);
    }
  };

  const handleChatSelect = (chatId: string) => {
    navigate(`/chat/${clientId}?chatId=${chatId}`);
  };

  const handleDeleteChat = async (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation(); // Prevent triggering chat selection
    const success = await deleteChat(chatId);
    
    // If the deleted chat was currently active, navigate to the client chat without chatId
    if (success && currentChatId === chatId) {
      navigate(`/chat/${clientId}`);
    }
  };

  return (
    <div className={`relative h-full bg-background border-r border-border/40 transition-all duration-300 ${isOpen ? 'w-80' : 'w-12'}`}>
      {isOpen ? (
        <div className="p-4 h-full flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <Button onClick={handleNewChat} className="flex-1 mr-2" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Chat
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="flex-shrink-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>

          <ScrollArea className="flex-1">
            <div className="space-y-2">
              {isLoading ? (
                <div className="text-sm text-muted-foreground">Loading chats...</div>
              ) : chatHistory.length === 0 ? (
                <div className="text-sm text-muted-foreground">No chat history yet</div>
              ) : (
                chatHistory.map((chat) => (
                  <div
                    key={chat.id}
                    className={`group relative rounded-md ${currentChatId === chat.id ? 'bg-secondary' : 'hover:bg-muted'}`}
                  >
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-left h-auto p-3 pr-10"
                      onClick={() => handleChatSelect(chat.id)}
                    >
                      <div className="flex items-start space-x-2 w-full">
                        <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm truncate">
                            {chat.chat_name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(chat.created_at), 'MMM d, HH:mm')}
                          </div>
                        </div>
                      </div>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => handleDeleteChat(e, chat.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      ) : (
        <div className="h-full flex flex-col items-center">
          <div className="p-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="w-8 h-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <MessageSquare className="h-6 w-6 text-muted-foreground" />
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatSidebar;
