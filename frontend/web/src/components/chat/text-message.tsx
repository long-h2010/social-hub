import type { Ref } from 'react';
import { useState } from 'react';
import { useAuth } from '../../contexts/auth-context';
import type { Chat, Message } from '../../types/chat';

interface Props {
  messages: Message[];
  chat: Chat;
  ref: Ref<HTMLDivElement | null>;
}

const Lightbox: React.FC<{ src: string; onClose: () => void }> = ({
  src,
  onClose,
}) => (
  <div
    className='fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4'
    onClick={onClose}
  >
    <img
      src={src}
      alt='full'
      className='max-h-[90vh] max-w-[90vw] rounded-2xl shadow-2xl object-contain'
      onClick={(e) => e.stopPropagation()}
    />
  </div>
);

const TextMessage: React.FC<Props> = ({ messages, chat, ref }) => {
  const { user } = useAuth();
  const currentUserId = user?._id;
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  console.log(messages)

  return (
    <>
      {lightboxSrc && (
        <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
      )}

      <div className='flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50 to-white'>
        {messages?.map((message) => {
          const isMine = message.user.id === currentUserId;
          const hasText = !!message.content;
          const hasImages = message.images && message.images.length > 0;

          return (
            <div
              key={message.id}
              className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`flex items-end space-x-2 max-w-md ${
                  isMine ? 'flex-row-reverse space-x-reverse' : ''
                }`}
              >
                {!isMine && (
                  <img
                    src={message.user.avatar}
                    alt='avatar'
                    className='w-8 h-8 rounded-full flex-shrink-0'
                  />
                )}

                <div>
                  {chat.isGroup && !isMine && (
                    <p className='text-xs text-gray-500 mb-1 px-2'>
                      {message.user.name}
                    </p>
                  )}

                  {hasImages && (
                    <div
                      className={`mb-1 ${
                        message.images!.length === 1
                          ? 'flex'
                          : 'grid grid-cols-2 gap-1'
                      } ${isMine ? 'justify-end' : 'justify-start'}`}
                    >
                      {message.images!.map((url, i) => (
                        <img
                          key={i}
                          src={url}
                          alt={`img-${i}`}
                          onClick={() => setLightboxSrc(url)}
                          className={`rounded-2xl object-cover cursor-zoom-in shadow-md transition-transform hover:scale-[1.02] ${
                            message.images!.length === 1
                              ? 'max-w-[260px] max-h-[320px] w-full'
                              : 'w-32 h-32'
                          } ${
                            isMine
                              ? 'rounded-br-none'
                              : 'rounded-bl-none'
                          }`}
                        />
                      ))}
                    </div>
                  )}

                  {hasText && (
                    <div
                      className={`px-5 py-3 rounded-3xl shadow-md ${
                        isMine
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-br-none'
                          : 'bg-white text-gray-800 rounded-bl-none'
                      }`}
                    >
                      <p className='text-sm leading-relaxed'>{message.content}</p>
                    </div>
                  )}

                  <span
                    className={`text-xs text-gray-400 mt-1 block ${
                      isMine ? 'text-right' : 'text-left'
                    }`}
                  >
                    {message.time}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        <div ref={ref} />
      </div>
    </>
  );
};

export default TextMessage;
