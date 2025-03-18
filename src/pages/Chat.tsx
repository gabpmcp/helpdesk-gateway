
import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Avatar, 
  AvatarFallback, 
  AvatarImage 
} from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bot, Send, User as UserIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

const Chat: React.FC = () => {
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<any[]>([
    {
      id: 1,
      sender: 'bot',
      content: 'Hello! Welcome to our helpdesk chat. How can I assist you today?',
      timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString() // 5 minutes ago
    }
  ]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    // Add user message
    const userMessage = {
      id: chatMessages.length + 1,
      sender: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };
    
    setChatMessages([...chatMessages, userMessage]);
    setMessage('');
    
    // Simulate bot response after a short delay
    setTimeout(() => {
      const botMessage = {
        id: chatMessages.length + 2,
        sender: 'bot',
        content: "I'm reviewing your question. For more complex issues, you might want to create a support ticket for detailed assistance. Can you provide more information about what you're experiencing?",
        timestamp: new Date().toISOString()
      };
      
      setChatMessages(prev => [...prev, botMessage]);
    }, 1500);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Support Chat</h1>
      <p className="text-muted-foreground">
        Chat with our support team or AI assistant
      </p>

      <Tabs defaultValue="chatbot" className="w-full">
        <TabsList className="grid w-full md:w-[400px] grid-cols-2">
          <TabsTrigger value="chatbot">AI Assistant</TabsTrigger>
          <TabsTrigger value="livechat">Live Support</TabsTrigger>
        </TabsList>
        
        <TabsContent value="chatbot" className="mt-6">
          <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarFallback>
                    <Bot className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle>AI Support Assistant</CardTitle>
                  <CardDescription>
                    Get quick answers to common questions
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="border-t">
                <ScrollArea className="h-[500px] p-4">
                  <div className="space-y-4">
                    {chatMessages.map((msg) => (
                      <div 
                        key={msg.id} 
                        className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div 
                          className={`max-w-[80%] p-3 rounded-lg ${
                            msg.sender === 'user' 
                              ? 'bg-primary text-primary-foreground ml-12' 
                              : 'bg-muted mr-12'
                          }`}
                        >
                          <div className="mb-1 flex items-center">
                            {msg.sender === 'user' ? (
                              <div className="flex items-center">
                                <span className="text-xs opacity-70 ml-auto">
                                  {formatTime(msg.timestamp)}
                                </span>
                                <Avatar className="h-6 w-6 ml-2">
                                  <AvatarFallback className="text-[10px]">
                                    <UserIcon className="h-3 w-3" />
                                  </AvatarFallback>
                                </Avatar>
                              </div>
                            ) : (
                              <div className="flex items-center">
                                <Avatar className="h-6 w-6 mr-2">
                                  <AvatarFallback className="text-[10px]">
                                    <Bot className="h-3 w-3" />
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-xs opacity-70">
                                  {formatTime(msg.timestamp)}
                                </span>
                              </div>
                            )}
                          </div>
                          <p>{msg.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                
                <div className="p-4 border-t">
                  <form onSubmit={handleSendMessage} className="flex space-x-2">
                    <Input 
                      value={message} 
                      onChange={(e) => setMessage(e.target.value)} 
                      placeholder="Type your message..." 
                      className="flex-1"
                    />
                    <Button type="submit">
                      <Send className="h-4 w-4 mr-2" />
                      Send
                    </Button>
                  </form>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="livechat" className="mt-6">
          <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
              <div className="flex justify-center items-center py-10">
                <div className="text-center">
                  <h3 className="text-xl font-medium mb-2">Live Support</h3>
                  <p className="text-muted-foreground mb-6">
                    Connect with a support agent for real-time assistance
                  </p>
                  <Button>
                    Start Live Chat
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="border-t p-6">
              <p className="text-muted-foreground text-center">
                Live support is available Monday to Friday, 9AM to 5PM EST.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Chat;
