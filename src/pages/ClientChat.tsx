import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useClients } from '@/hooks/useClients';
import { useChatHistory } from '@/hooks/useChatHistory';
import { ChevronDown, Send, ArrowLeft, User, Settings, LogOut, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ChatSidebar from '@/components/ChatSidebar';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

const ClientChat = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentChatId = searchParams.get('chatId');
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { clients, isLoading } = useClients();
  const { chatHistory, saveMessageToChat, getChatMessages, createNewChat } = useChatHistory(clientId);
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const client = clients.find(c => c.id === clientId);

  const suggestedTopics = [
    "Create a marketing strategy",
    "Develop content ideas",
    "Analyze target audience",
    "Improve brand messaging",
    "Plan social media content",
    "Design email campaigns"
  ];

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
          variant: "destructive",
        });
      } else {
        toast({
          title: "Signed out successfully",
          description: "You have been signed out of your account",
        });
        navigate('/', { replace: true });
      }
    } catch (err) {
      console.error('Unexpected sign out error:', err);
      toast({
        title: "Error",
        description: "An unexpected error occurred while signing out.",
        variant: "destructive",
      });
    }
  };

  const handleProfile = () => {
    navigate('/profile');
  };

  const handleSettings = () => {
    toast({
      title: "Settings", 
      description: "Settings page coming soon!"
    });
  };

  const handleClientChange = (newClientId: string) => {
    navigate(`/chat/${newClientId}`);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !client) return;

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

    // Update UI immediately
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Save user message to database
    await saveMessageToChat(activeChatId, userMessage);

    // Simulate AI response
    setTimeout(async () => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `I can help you with "${inputValue}" for ${client.client_name}. Let me provide you with some strategic insights.`,
        isUser: false,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);

      // Save AI message to database
      await saveMessageToChat(activeChatId, aiMessage);
    }, 1500);
  };

  const handleSuggestedTopic = (topic: string) => {
    setInputValue(topic);
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!client) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col w-full">
      {/* Header */}
      <div className="border-b border-border/40">
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

      {/* Chat Title Section */}
      <div className="border-b border-border/40 bg-muted/30">
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
                      <span className="text-purple-600 font-medium">{client.client_name}</span>
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
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Suggest Topics
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {suggestedTopics.map((topic, index) => (
                  <DropdownMenuItem key={index} onClick={() => handleSuggestedTopic(topic)}>
                    {topic}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main Chat Area with Sidebar */}
      <div className="flex-1 flex min-h-0">
        {/* Chat Sidebar */}
        <ChatSidebar 
          clientId={clientId!} 
          currentChatId={currentChatId || undefined}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Chat Content */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Messages Area with Scroll */}
          <div className="flex-1 overflow-y-auto">
            <div className="container py-6 max-w-4xl">
              <div className="space-y-4 mb-6">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <Card className={`max-w-[80%] ${message.isUser ? 'bg-purple-600 text-white' : 'bg-muted'}`}>
                      <CardContent className="p-4">
                        <p className="text-sm leading-relaxed">{message.content}</p>
                        <p className={`text-xs mt-2 opacity-70 ${message.isUser ? 'text-purple-100' : 'text-muted-foreground'}`}>
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex justify-start">
                    <Card className="bg-muted">
                      <CardContent className="p-4">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
          </div>

          {/* Input Area - Fixed at Bottom */}
          <div className="border-t border-border/40 bg-background/95 backdrop-blur">
            <div className="container py-4 max-w-4xl">
              <div className="flex space-x-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask anything about your client's growth strategy..."
                  className="flex-1"
                  disabled={isTyping}
                />
                <Button onClick={handleSendMessage} disabled={!inputValue.trim() || isTyping}>
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
