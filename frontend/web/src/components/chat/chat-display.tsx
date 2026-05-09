import { Smile, Send, Image, X } from 'lucide-react';
import { useRef, useState } from 'react';
import ChatHeader from './chat-header';
import TextMessage from './text-message';
import type { Chat, Message } from '../../types/chat';
import type { Ref } from 'react';
import SkeletonLoading from './skeleton-loading';
import AxiosClient from '../../api/axios-client';

interface ImageItem {
  file: File;
  preview: string;
}

interface Props {
  chat: Chat;
  loading: boolean;
  messages: Message[];
  messageInput: string;
  setMessageInput: (value: string) => void;
  handleSendMessage: (id: string, images?: string[]) => void;
  ref: Ref<HTMLDivElement | null>;
  onCall: () => void;
}

const ChatDisplay: React.FC<Props> = ({
  chat,
  loading,
  messages,
  messageInput,
  setMessageInput,
  handleSendMessage,
  ref,
  onCall,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageItems, setImageItems] = useState<ImageItem[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleImageClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).filter((f) =>
      f.type.startsWith('image/'),
    );
    if (!files.length) return;

    const remaining = 5 - imageItems.length;
    const accepted = files.slice(0, remaining);

    accepted.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setImageItems((prev) => [
          ...prev,
          { file, preview: reader.result as string },
        ]);
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const handleRemoveImage = (index: number) => {
    setImageItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    const hasImages = imageItems.length > 0;
    const hasText = messageInput.trim();

    if (!hasImages && !hasText) return;

    if (hasImages) {
      try {
        setUploading(true);

        const formData = new FormData();
        imageItems.forEach((item) => formData.append('images', item.file));
        formData.append('chatId', chat.id);
        if (hasText) formData.append('message', messageInput.trim());

        const res = await AxiosClient.post(
          import.meta.env.VITE_APP_MESSAGE_SEND_IMAGES_ENDPOINT,
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } },
        );

        handleSendMessage(chat.id, res.data.images);
      } catch (err) {
        console.error('Image upload failed:', err);
      } finally {
        setUploading(false);
        setImageItems([]);
        setMessageInput('');
      }
      return;
    }

    handleSendMessage(chat.id);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) handleSend();
  };

  const canSend =
    (!!messageInput.trim() || imageItems.length > 0) && !uploading;

  return (
    <div className='flex-1 flex flex-col bg-white'>
      <ChatHeader chat={chat} onCall={onCall} />

      {loading ? (
        <SkeletonLoading />
      ) : (
        <TextMessage messages={messages} chat={chat} ref={ref} />
      )}

      <div className='p-6 border-t border-gray-200 bg-white'>
        {imageItems.length > 0 && (
          <div className='flex flex-wrap gap-2 mb-3'>
            {imageItems.map((item, i) => (
              <div key={i} className='relative'>
                <img
                  src={item.preview}
                  alt={`preview-${i}`}
                  className='h-20 w-20 rounded-xl object-cover border border-gray-200 shadow-sm'
                />
                {uploading ? (
                  <div className='absolute inset-0 rounded-xl bg-black/40 flex items-center justify-center'>
                    <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                  </div>
                ) : (
                  <button
                    onClick={() => handleRemoveImage(i)}
                    className='absolute -top-2 -right-2 w-5 h-5 bg-gray-700 hover:bg-red-500 text-white rounded-full flex items-center justify-center transition-colors shadow'
                  >
                    <X size={11} />
                  </button>
                )}
              </div>
            ))}

            {imageItems.length < 5 && !uploading && (
              <button
                onClick={handleImageClick}
                className='h-20 w-20 rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-400 flex items-center justify-center text-gray-400 hover:text-blue-500 transition-colors'
              >
                <Image size={22} />
              </button>
            )}
          </div>
        )}

        <div className='flex items-center space-x-3'>
          <input
            ref={fileInputRef}
            type='file'
            accept='image/*'
            multiple
            className='hidden'
            onChange={handleFileChange}
          />

          {imageItems.length === 0 && (
            <button
              onClick={handleImageClick}
              disabled={uploading}
              className='p-3 hover:bg-blue-50 rounded-full transition-all group disabled:opacity-50'
            >
              <Image className='w-6 h-6 text-gray-400 group-hover:text-blue-600 transition-colors' />
            </button>
          )}

          <div className='flex-1 relative'>
            <input
              type='text'
              placeholder={
                imageItems.length > 0 ? 'Thêm chú thích...' : 'Nhập tin nhắn...'
              }
              className='w-full bg-gray-100 rounded-full px-6 py-4 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all pr-12 disabled:opacity-60'
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={uploading}
            />
            <button className='absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-200 rounded-full transition-all'>
              <Smile className='w-5 h-5 text-gray-400' />
            </button>
          </div>

          <button
            onClick={handleSend}
            disabled={!canSend}
            className={`p-4 rounded-full transition-all shadow-lg ${
              canSend
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-xl hover:scale-105'
                : 'bg-gray-200'
            }`}
          >
            <Send
              className={`w-5 h-5 ${canSend ? 'text-white' : 'text-gray-400'}`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatDisplay;
