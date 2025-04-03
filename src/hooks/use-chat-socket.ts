/**
 * Hook para gestionar la comunicación WebSocket para el chat
 * 
 * Proporciona funcionalidad para conectar, enviar y recibir mensajes
 * de forma reactiva y funcional
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { Map, List, fromJS } from 'immutable';

export interface ChatMessage {
  id?: string;
  content: string;
  sender?: string;
  senderName?: string;
  type?: 'user' | 'agent' | 'system' | 'error';
  timestamp?: string;
  ticketId?: string;
}

interface UseChatSocketOptions {
  autoConnect?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: any) => void;
}

export const useChatSocket = (ticketId: string, options: UseChatSocketOptions = {}) => {
  const [messages, setMessages] = useState<List<Map<string, any>>>(List());
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const { autoConnect = true } = options;

  // Función para conectar al WebSocket
  const connect = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      // Crear WebSocket para el ticket específico
      const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/tickets/${ticketId}`;
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log(`WebSocket conectado para ticket ${ticketId}`);
        setIsConnected(true);
        setError(null);
        if (options.onConnect) {
          options.onConnect();
        }
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setMessages(prev => prev.push(fromJS(data)));
        } catch (err) {
          console.error('Error al procesar mensaje:', err);
        }
      };
      
      ws.onclose = () => {
        console.log(`WebSocket desconectado para ticket ${ticketId}`);
        setIsConnected(false);
        if (options.onDisconnect) {
          options.onDisconnect();
        }
      };
      
      ws.onerror = (event) => {
        console.error('Error en WebSocket:', event);
        setError('Error de conexión con el servidor de chat');
        if (options.onError) {
          options.onError(event);
        }
      };
      
      socketRef.current = ws;
    } catch (err) {
      console.error('Error al crear WebSocket:', err);
      setError(`Error al conectar: ${err.message}`);
      if (options.onError) {
        options.onError(err);
      }
    }
  }, [ticketId, options]);
  
  // Función para desconectar
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
  }, []);
  
  // Función para enviar mensajes
  const sendMessage = useCallback((message: ChatMessage) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      setError('No hay conexión con el servidor de chat');
      return false;
    }
    
    try {
      socketRef.current.send(JSON.stringify(message));
      return true;
    } catch (err) {
      console.error('Error al enviar mensaje:', err);
      setError(`Error al enviar mensaje: ${err.message}`);
      return false;
    }
  }, []);
  
  // Conectar automáticamente al montar el componente
  useEffect(() => {
    if (autoConnect) {
      connect();
    }
    
    // Limpiar al desmontar
    return () => {
      disconnect();
    };
  }, [connect, disconnect, autoConnect]);
  
  return {
    messages: messages.toJS() as ChatMessage[],
    isConnected,
    error,
    connect,
    disconnect,
    sendMessage
  };
};

export default useChatSocket;
