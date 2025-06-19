
import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { useClients } from '@/hooks/useClients';
import { useChatHistory } from '@/hooks/useChatHistory';
import { ChevronDown, Send, ArrowLeft, User, LogOut, LoaderCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ChatSidebar from '@/components/ChatSidebar';
import { streamChatResponse } from '@/utils/chatApi';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  isStreaming?: boolean;
}

// Helper function to format AI response content
const formatAIResponse = (content: string) => {
  // Split content into paragraphs
  const paragraphs = content.split('\n\n').filter(p => p.trim());
  
  return paragraphs.map((paragraph, index) => {
    const trimmed = paragraph.trim();
    
    // Handle headings (lines starting with #)
    if (trimmed.startsWith('#')) {
      const level = trimmed.match(/^#+/)?.[0].length || 1;
      const text = trimmed.replace(/^#+\s*/, '');
      
      if (level === 1) {
        return <h1 key={index} className="text-lg font-bold mb-3 text-foreground">{text}</h1>;
      } else if (level === 2) {
        return <h2 key={index} className="text-base font-semibold mb-2 text-foreground">{text}</h2>;
      } else {
        return <h3 key={index} className="text-sm font-medium mb-2 text-foreground">{text}</h3>;
      }
    }
    
    // Handle bullet points
    if (trimmed.includes('\n- ') || trimmed.startsWith('- ')) {
      const items = trimmed.split('\n').filter(line => line.trim().startsWith('- '));
      if (items.length > 0) {
        return (
          <ul key={index} className="list-disc pl-4 mb-3 space-y-1">
            {items.map((item, itemIndex) => (
              <li key={itemIndex} className="text-sm leading-relaxed">
                {item.replace(/^- /, '')}
              </li>
            ))}
          </ul>
        );
      }
    }
    
    // Handle numbered lists
    if (trimmed.includes('\n1. ') || /^\d+\.\s/.test(trimmed)) {
      const items = trimmed.split('\n').filter(line => /^\d+\.\s/.test(line.trim()));
      if (items.length > 0) {
        return (
          <ol key={index} className="list-decimal pl-4 mb-3 space-y-1">
            {items.map((item, itemIndex) => (
              <li key={itemIndex} className="text-sm leading-relaxed">
                {item.replace(/^\d+\.\s/, '')}
              </li>
            ))}
          </ol>
        );
      }
    }
    
    // Regular paragraph
    return (
      <p key={index} className="text-sm leading-relaxed mb-3 last:mb-0">
        {trimmed}
      </p>
    );
  });
};

const ClientChat = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentChatId = searchParams.get('chatId');
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { clients, isLoading } = useClients();
  const {
    chatHistory,
    saveMessageToChat,
    getChatMessages,
    createNewChat,
    fetchChatHistory
  } = useChatHistory(clientId);
  const { toast } = useToast();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const client = clients.find(c => c.id === clientId);

  // Load messages when chat changes
  useEffect(() => {
    if (currentChatId) {
      const chatMessages = getChatMessages(currentChatId);
      setMessages(chatMessages);
    } else if (client && user) {
      // Show welcome message for new chat
      const welcomeMessage: Message = {
        id: 'welcome',
        content: `Hi! I'm here to help with ${client.client_name}. What can I assist you with today?`,
        isUser: false,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [currentChatId, client, user, chatHistory]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSignOut = async () => {
    try {
      const { error } = await signOut();
      if (error) {
        console.error('Sign out error:', error);
        toast({
          title: "Error",
          description: "Failed to sign out. Please try again.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Signed out successfully",
          description: "You have been signed out of your account"
        });
        navigate('/', { replace: true });
      }
    } catch (err) {
      console.error('Unexpected sign out error:', err);
      toast({
        title: "Error",
        description: "An unexpected error occurred while signing out.",
        variant: "destructive"
      });
    }
  };

  const handleProfile = () => {
    navigate('/profile');
  };

  const handleClientChange = (newClientId: string) => {
    navigate(`/chat/${newClientId}`);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !client || !user || isWaitingForResponse) return;

    let activeChatId = currentChatId;

    // If no current chat, create a new one
    if (!activeChatId) {
      const chatName = `Chat ${new Date().toLocaleString()}`;
      const newChat = await createNewChat(chatName);
      if (!newChat) {
        toast({
          title: "Error",
          description: "Failed to create new chat",
          variant: "destructive"
        });
        return;
      }
      activeChatId = newChat.id;
      navigate(`/chat/${clientId}?chatId=${activeChatId}`, { replace: true });
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      isUser: true,
      timestamp: new Date()
    };

    // Update UI immediately with user message
    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue('');
    setIsWaitingForResponse(true);

    // Save user message to database
    await saveMessageToChat(activeChatId, userMessage);

    // Create AI message placeholder for streaming
    const aiMessageId = (Date.now() + 1).toString();
    const aiMessage: Message = {
      id: aiMessageId,
      content: '',
      isUser: false,
      timestamp: new Date(),
      isStreaming: true
    };

    // Add empty AI message to UI immediately
    setMessages(prev => [...prev, aiMessage]);

    try {
      console.log('Starting streaming response...');
      
      // Stream response from backend with real-time UI updates
      await streamChatResponse({
        client_id: clientId!,
        chat_id: activeChatId,
        user_id: user.id,
        user_input: currentInput
      }, {
        onData: (chunk: string) => {
          console.log('Received streaming chunk:', chunk);
          setIsWaitingForResponse(false);

          // Update the AI message content in real-time - FORCE IMMEDIATE UPDATE
          setMessages(prev => {
            const newMessages = prev.map(msg => {
              if (msg.id === aiMessageId) {
                return {
                  ...msg,
                  content: msg.content + chunk,
                  isStreaming: true
                };
              }
              return msg;
            });
            console.log('Updated messages with new chunk, total AI content length:', 
              newMessages.find(m => m.id === aiMessageId)?.content.length);
            return newMessages;
          });
        },
        onComplete: async () => {
          console.log('Stream completed');
          setIsWaitingForResponse(false);

          // Mark streaming as complete and save final message
          setMessages(prev => {
            const updatedMessages = prev.map(msg => {
              if (msg.id === aiMessageId) {
                const finalMessage = {
                  ...msg,
                  isStreaming: false
                };
                // Save the complete AI message to database
                saveMessageToChat(activeChatId, finalMessage);
                return finalMessage;
              }
              return msg;
            });
            return updatedMessages;
          });

          await fetchChatHistory();
        },
        onError: (error: Error) => {
          console.error('Streaming error:', error);
          setIsWaitingForResponse(false);

          // Show error message to user
          const errorMessage = 'Sorry, I encountered an error while processing your request. Please try again.';

          // Update with error message
          setMessages(prev => {
            return prev.map(msg => {
              if (msg.id === aiMessageId) {
                return {
                  ...msg,
                  content: errorMessage,
                  isStreaming: false
                };
              }
              return msg;
            });
          });

          toast({
            title: "Error",
            description: "Failed to get response from GrowthScript Brain. Please try again.",
            variant: "destructive"
          });
        }
      });
    } catch (error) {
      console.error('Chat error:', error);
      setIsWaitingForResponse(false);
      
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    if (!isLoading && !client && clientId) {
      toast({
        title: "Client not found",
        description: "The requested client could not be found.",
        variant: "destructive"
      });
      navigate('/dashboard');
    }
  }, [client, clientId, isLoading, navigate, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoaderCircle className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!client) {
    return null;
  }

  return (
    <div className="h-screen bg-background flex flex-col w-full overflow-hidden">
      {/* Header - Fixed */}
      <div className="border-b border-border/40 flex-shrink-0">
        <div className="container flex h-16 items-center justify-between">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-xl font-bold text-transparent">
            GrowthScript
          </div>
          <div className="flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">
                    {user?.email}
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={handleProfile}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Chat Title Section - Fixed */}
      <div className="border-b border-border/40 bg-muted/30 flex-shrink-0">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Client:</span>
                <Select value={clientId} onValueChange={handleClientChange}>
                  <SelectTrigger className="w-auto min-w-[200px]">
                    <SelectValue>
                      <span className="text-purple-600 font-medium">{client?.client_name}</span>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.client_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-muted-foreground">→ GrowthScript Brain</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area with Sidebar - Flexible */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Chat Sidebar */}
        <ChatSidebar
          clientId={clientId!}
          currentChatId={currentChatId || undefined}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Chat Content - Flexible with internal scroll */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Messages Area with Scroll - Flexible */}
          <ScrollArea className="flex-1">
            <div className="container py-6 max-w-4xl">
              <div className="space-y-6 mb-6">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
                    <Card className={`max-w-[85%] ${message.isUser ? 'bg-purple-600 text-white' : 'bg-muted'}`}>
                      <CardContent className="p-5">
                        <div className="text-sm leading-relaxed">
                          {message.isUser ? (
                            <p className="whitespace-pre-wrap">{message.content}</p>
                          ) : (
                            <div className="prose prose-sm max-w-none dark:prose-invert">
                              {message.content ? formatAIResponse(message.content) : (
                                <div className="flex items-center space-x-2">
                                  <div className="flex space-x-1">
                                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                  </div>
                                  <span className="text-xs opacity-70">Thinking...</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        {message.isStreaming && message.content && (
                          <div className="flex items-center mt-3 pt-3 border-t border-border/20">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse"></div>
                              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                            </div>
                            <span className="text-xs ml-2 opacity-70">AI is typing...</span>
                          </div>
                        )}
                        <p className={`text-xs mt-3 opacity-70 ${message.isUser ? 'text-purple-100' : 'text-muted-foreground'}`}>
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                ))}
                
                {/* Waiting for response animation with circle */}
                {isWaitingForResponse && (
                  <div className="flex justify-start">
                    <Card className="bg-muted max-w-[85%]">
                      <CardContent className="p-5">
                        <div className="flex items-center space-x-3">
                          <LoaderCircle className="h-5 w-5 animate-spin text-purple-600" />
                          <span className="text-sm text-muted-foreground">Waiting for GrowthScript Brain's response...</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </div>
          </ScrollArea>

          {/* Input Area - Fixed at Bottom */}
          <div className="border-t border-border/40 bg-background/95 backdrop-blur flex-shrink-0">
            <div className="container py-4 max-w-4xl">
              <div className="flex space-x-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask anything about your client's growth strategy..."
                  className="flex-1"
                  disabled={isWaitingForResponse}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isWaitingForResponse}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientChat;
