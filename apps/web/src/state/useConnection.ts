import { useEffect, useRef, useState, useCallback } from 'react';

interface OutgoingBase { type: string; [k: string]: any }

export function useConnection() {
  const wsRef = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'open' | 'closed'>('idle');
  const [id, setId] = useState<string | null>(null);
  const [lastPong, setLastPong] = useState<number | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const reconnectTimer = useRef<number | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) return;
    setStatus('connecting');
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const url = `${proto}://${window.location.host}/ws`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus('open');
      ping();
    };
    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (data.type === 'welcome') {
          setId(data.id);
        } else if (data.type === 'pong') {
          setLastPong(Date.now());
        } else {
          setMessages(m => [...m, data]);
        }
      } catch (e) {
        console.warn('non-json msg', ev.data);
      }
    };
    ws.onclose = () => {
      setStatus('closed');
      scheduleReconnect();
    };
    ws.onerror = () => {
      ws.close();
    };
  }, []);

  const scheduleReconnect = () => {
    if (reconnectTimer.current) return;
    reconnectTimer.current = window.setTimeout(() => {
      reconnectTimer.current = null;
      connect();
    }, 1500);
  };

  const send = (o: OutgoingBase) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(o));
    }
  };

  const ping = () => send({ type: 'ping' });

  const sendChat = () => {
    if (!chatInput.trim()) return;
    send({ type: 'chat-message', chatId: 'lobby', payload: { text: chatInput, at: Date.now() } });
    setChatInput('');
  };

  useEffect(() => {
    connect();
    const i = setInterval(ping, 10000);
    return () => { clearInterval(i); wsRef.current?.close(); };
  }, [connect]);

  return { status, id, lastPong, messages, sendChat, chatInput, setChatInput, connect };
}