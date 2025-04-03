/**
 * Componente TicketChat
 * 
 * Proporciona interfaz de chat en tiempo real para un ticket específico
 * usando WebSockets y patrones funcionales/inmutables
 */
import React, { useState, useRef, useEffect } from 'react';
import { List } from 'immutable';
import useChatSocket, { ChatMessage } from '@/hooks/use-chat-socket';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TicketChatProps {
  ticketId: string;
  userName: string;
  userId: string;
}

/**
 * Formatea la fecha de un mensaje de chat
 */
const formatTimestamp = (timestamp: string | undefined): string => {
  if (!timestamp) return '';
  
  try {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (error) {
    console.error('Error al formatear timestamp:', error);
    return '';
  }
};

const TicketChat: React.FC<TicketChatProps> = ({ ticketId, userName, userId }) => {
  const [messageText, setMessageText] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  const { 
    messages, 
    isConnected, 
    error, 
    sendMessage 
  } = useChatSocket(ticketId, {
    onConnect: () => {
      toast({
        title: 'Chat conectado',
        description: 'Estás conectado al chat en tiempo real',
        variant: 'default',
      });
    },
    onDisconnect: () => {
      toast({
        title: 'Chat desconectado',
        description: 'Se ha perdido la conexión con el chat',
        variant: 'destructive',
      });
    },
    onError: () => {
      toast({
        title: 'Error en el chat',
        description: 'No se pudo conectar al servidor de chat',
        variant: 'destructive',
      });
    }
  });
  
  // Desplazarse al último mensaje cuando se reciban nuevos mensajes
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);
  
  // Manejar envío de mensajes
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageText.trim()) return;
    
    const success = sendMessage({
      content: messageText.trim(),
      sender: userId,
      senderName: userName,
      type: 'user',
      ticketId
    });
    
    if (success) {
      setMessageText('');
    } else {
      toast({
        title: 'Error',
        description: 'No se pudo enviar el mensaje',
        variant: 'destructive',
      });
    }
  };
  
  // Renderizar burbuja de mensaje
  const renderMessage = (message: ChatMessage, index: number) => {
    const isSystem = message.type === 'system' || message.type === 'error';
    const isCurrentUser = message.sender === userId;
    
    return (
      <div 
        key={message.id || `msg-${index}`}
        className={`flex mb-4 ${isSystem ? 'justify-center' : isCurrentUser ? 'justify-end' : 'justify-start'}`}
      >
        {isSystem ? (
          <div className="bg-muted px-3 py-2 rounded-md text-sm text-muted-foreground">
            {message.content}
          </div>
        ) : (
          <div className={`flex ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
            <Avatar className="h-8 w-8">
              <AvatarImage src={`https://avatar.vercel.sh/${message.sender || 'user'}.png`} />
              <AvatarFallback>
                {message.senderName?.substring(0, 2)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className={`max-w-[75%] ${isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-secondary'} px-3 py-2 rounded-lg`}>
              <p className="text-sm">{message.content}</p>
              <p className="text-xs opacity-70 mt-1">{formatTimestamp(message.timestamp)}</p>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Chat en vivo</span>
          {isConnected ? (
            <span className="text-xs bg-green-100 text-green-800 py-0.5 px-2 rounded-full flex items-center">
              <span className="h-2 w-2 rounded-full bg-green-500 mr-1"></span>
              Conectado
            </span>
          ) : (
            <span className="text-xs bg-red-100 text-red-800 py-0.5 px-2 rounded-full flex items-center">
              <span className="h-2 w-2 rounded-full bg-red-500 mr-1"></span>
              Desconectado
            </span>
          )}
        </CardTitle>
      </CardHeader>
      
      <ScrollArea 
        ref={scrollAreaRef}
        className="flex-1 px-4"
      >
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            No hay mensajes aún
          </div>
        ) : (
          messages.map((message, index) => renderMessage(message, index))
        )}
      </ScrollArea>
      
      <CardContent className="pt-3">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Escribe un mensaje..."
            className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={!isConnected}
          />
          <Button 
            type="submit" 
            size="icon"
            disabled={!isConnected || !messageText.trim()}
          >
            {isConnected ? <Send className="h-4 w-4" /> : <Loader2 className="h-4 w-4 animate-spin" />}
          </Button>
        </form>
        
        {error && (
          <p className="text-xs text-destructive mt-2">{error}</p>
        )}
      </CardContent>
    </Card>
  );
};

export default TicketChat;
