import { Users } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSocket } from '../contexts/socket-context';
import AxiosClient from '../api/axios-client';
import type { Chat, Message } from '../types/chat';
import { IconButton, SearchField } from '../components/common';
import {
  ChatDisplay,
  Conversation,
  CreateGroupModal,
  DefaultDisplay,
} from '../components/chat';
import { mapChatApi, mapMessageApi } from '../utils/map-api';
import { useAuth } from '../contexts/auth-context';
import { useCall } from '../contexts/call-context';

const Messenger: React.FC = () => {
  const { user } = useAuth();
  const { setCallee } = useCall();
  const { socket, onlines } = useSocket();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [msgLoading, setMsgLoading] = useState<boolean>(false);
  const ref = useRef<HTMLDivElement | null>(null);

  const fetchChats = useCallback(async () => {
    try {
      const res = await AxiosClient.get(import.meta.env.VITE_APP_CHAT_ENDPOINT);
      setChats(res.data.map(mapChatApi));
    } catch (err) {
      console.error('Failed to load chats', err);
    }
  }, []);

  useEffect(() => {
    fetchChats();
  }, []);

  useEffect(() => {
    if (chats.length === 0) return;

    const chatId = localStorage.getItem('chat');
    if (!chatId) return;

    const chat = chats.find((c) => c.id === chatId);
    if (chat) {
      handleSelectChat(chat);
      localStorage.removeItem('chat');
    }
  }, [chats]);

  const conversation = useMemo(() => {
    return chats.map((chat) => ({
      ...chat,
      online: onlines.includes(chat.otherUser),
    }));
  }, [chats, onlines]);

  useEffect(() => {
    if (!socket || chats.length === 0) return;

    const chatIds = chats.map((chat) => chat.id);
    socket.emit('join-all-chats', { chatIds });
  }, [socket, chats]);

  const fetchMessages = useCallback(
    async (chatId: string) => {
      if (messages[chatId]) return messages[chatId];

      try {
        setMsgLoading(true);
        const res = await AxiosClient.get(
          `${import.meta.env.VITE_APP_MESSAGE_ENDPOINT}/${chatId}`,
        );
        const mapped = res.data.map(mapMessageApi);
        setMessages((prev) => ({ ...prev, [chatId]: mapped }));
      } catch (err) {
        console.error('Failed to load messages', err);
      } finally {
        setMsgLoading(false);
      }
    },
    [messages],
  );

  const scrollToBottom = useCallback((instant: boolean = false) => {
    if (!ref.current) return;

    const container = ref.current.parentElement;
    if (!container) return;

    if (instant) {
      container.scrollTop = container.scrollHeight;
    } else {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, []);

  const handleSelectChat = useCallback(
    (chat: Chat) => {
      if (selectedChat?.id === chat.id) return;

      setChats((prev) =>
        prev.map((c) => (c.id === chat.id ? { ...c, unread: 0 } : c)),
      );
      setSelectedChat(chat);

      AxiosClient.put(
        `${import.meta.env.VITE_APP_MESSAGE_MASK_READED_ENDPOINT}/${chat.id}`,
      );

      fetchMessages(chat.id).then(() => {
        setTimeout(() => {
          scrollToBottom(true);
        }, 0);
      });
    },
    [fetchMessages],
  );

  const handleSendMessage = async (chatId: string, images?: string[]) => {
    const hasText = messageInput.trim();
    const hasImages = images && images.length > 0;

    if (!hasText && !hasImages) return;

    socket?.emit('send-message', { chatId, message: messageInput.trim(), images: images });
    setMessageInput('');
  };

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg: any) => {
      const newMsg = mapMessageApi(msg);
      const chatId = msg.chat;

      setMessages((prev) => ({
        ...prev,
        [chatId]: [...(prev[chatId] || []), newMsg],
      }));

      setChats((prev) =>
        prev.map((chat) => {
          if (chat.id !== chatId) return chat;

          const isCurrentChat = selectedChat?.id === chatId;

          return {
            ...chat,
            lastMessage: {
              sender: { id: newMsg.user.id, name: newMsg.user.name },
              message: newMsg.content || (newMsg.images?.length ? '🖼 Đã gửi ảnh' : ''),
              time: newMsg.time,
            },
            time: newMsg.time,
            unread: isCurrentChat ? 0 : (chat.unread || 0) + 1,
          };
        }),
      );
    };

    socket.on('new-message', handleNewMessage);

    return () => {
      socket.off('new-message');
    };
  }, [socket, selectedChat]);

  useEffect(() => {
    if (!selectedChat) return;

    scrollToBottom(false);
  }, [messages[selectedChat?.id || '']]);

  const onClickCall = () => {
    if (!selectedChat?.isGroup) {
      setCallee({
        id: selectedChat?.otherUser,
        name: selectedChat?.displayName,
        avatar: selectedChat?.displayAvatar,
      });

      socket?.emit('calling', {
        chatId: selectedChat?.id,
        callee: selectedChat?.otherUser,
        caller: {
          id: user._id,
          name: user.name,
          avatar: user.avatar,
        },
      });
    }
  };

  return (
    <>
      <div className='flex h-screen pt-14 bg-gradient-to-br from-gray-50 to-gray-100'>
        <div className='w-96 bg-white border-r border-gray-200 flex flex-col shadow-sm'>
          <div className='p-6 border-b border-gray-200'>
            <div className='flex items-center justify-between mb-4'>
              <SearchField width='w-52' value={''} setValue={() => {}} />
              <IconButton
                icon={Users}
                hover={true}
                onClick={() => setShowCreateGroup(true)}
              />
            </div>
          </div>

          <div className='flex-1 overflow-y-auto'>
            {conversation.map((chat) => (
              <Conversation
                key={chat.id}
                chat={chat}
                active={selectedChat?.id === chat.id}
                onClick={() => handleSelectChat(chat)}
              />
            ))}
          </div>
        </div>

        {selectedChat ? (
          <ChatDisplay
            chat={selectedChat}
            loading={msgLoading}
            messages={messages[selectedChat.id]}
            messageInput={messageInput}
            setMessageInput={setMessageInput}
            handleSendMessage={handleSendMessage}
            ref={ref}
            onCall={onClickCall}
          />
        ) : (
          <DefaultDisplay />
        )}

        {showCreateGroup && (
          <CreateGroupModal
            users={chats}
            setShowCreateGroup={setShowCreateGroup}
          />
        )}
      </div>
    </>
  );
};

export default Messenger;
