import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './auth-context';
import { useCall } from './call-context';

interface SocketContextType {
  socket: Socket | null;
  onlines: string[];
}

const SocketContext = createContext<SocketContextType | null>(null);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const { token, isAuthenticated } = useAuth();
  const { callStatus, setCallStatus, setIncomingCall } = useCall();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlines, setOnlines] = useState<string[]>([]);

  const socketRef = useRef<Socket | null>(null);
  const callStatusRef = useRef(callStatus);

  useEffect(() => {
    callStatusRef.current = callStatus;
  }, [callStatus]);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      socketRef.current?.disconnect();
      return;
    }

    const newSocket = io(import.meta.env.VITE_APP_SOCKET_URL, {
      auth: { token },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
    });

    socketRef.current = newSocket;

    newSocket.on('online-list', (list: string[]) => {
      setOnlines(list);
    });

    newSocket.on('user-online', ({ userId }) => {
      setOnlines((prev) => [...new Set([...prev, userId])]);
    });

    newSocket.on('user-offline', ({ userId }) => {
      setOnlines((prev) => prev.filter((id) => id !== userId));
    });

    newSocket.on('calling', (data) => {
      setCallStatus('calling');
      setIncomingCall(data);
    });

    newSocket.on('ringing', (data) => {
      if (callStatusRef.current !== 'idle') {
        newSocket.emit('call-busy');
        return;
      }

      setCallStatus('ringing');
      setIncomingCall(data);
    });

    newSocket.on('accept-call', (data, callback) => {
      // ✅ Callback trước, state sau
      if (typeof callback === 'function') {
        callback({ success: true });
      }

      setIncomingCall(data);
      setCallStatus('in-call');
    });

    newSocket.on('callee-accept', () => {
      setCallStatus('in-call');
    });

    newSocket.on('call-ended', () => {
      setCallStatus('idle');
    });

    setSocket(newSocket);

    return () => {
      newSocket.removeAllListeners();
      newSocket.disconnect();
    };
  }, [token, isAuthenticated]);

  return (
    <SocketContext.Provider value={{ socket, onlines }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used inside SocketProvider');
  return ctx;
};
