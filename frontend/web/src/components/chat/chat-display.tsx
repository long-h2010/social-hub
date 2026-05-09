import { Smile, Send, Image } from 'lucide-react';
import ChatHeader from './chat-header';
import TextMessage from './text-message';
import type { Chat, Message } from '../../types/chat';
import type { Ref } from 'react';
import SkeletonLoading from './skeleton-loading';

interface Props {
  chat: Chat;
  loading: boolean;
  messages: Message[];
  messageInput: string;
  setMessageInput: (value: string) => void;
  handleSendMessage: (id: string) => void;
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
  onCall
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageItems, setImageItems] = useState<ImageItem[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).filter((f) =>
      f.type.startsWith('image/'),
    );
    if (!files.length) return;

    // Giới hạn tổng không quá 5 ảnh
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
        // BE dùng FilesInterceptor('images') nên field name là 'images'
        imageItems.forEach((item) => formData.append('images', item.file));

        // Gửi text và chatId kèm theo trong cùng request
        formData.append('chatId', chat.id);
        if (hasText) formData.append('message', messageInput.trim());

        const res = await AxiosClient.post(
          import.meta.env.VITE_APP_MESSAGE_ENDPOINT,
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } },
        );

        // BE trả về message đã tạo — gọi handler để cập nhật UI qua socket/state
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

  const canSend = (!!messageInput.trim() || imageItems.length > 0) && !uploading;

  return (
    <div className='flex-1 flex flex-col bg-white'>
      <ChatHeader chat={chat} onCall={onCall} />

      {loading ? (
        <SkeletonLoading />
      ) : (
        <TextMessage messages={messages} chat={chat} ref={ref} />
      )}

      <div className='p-6 border-t border-gray-200 bg-white'>
        <div className='flex items-center space-x-3'>
          <button className='p-3 hover:bg-blue-50 rounded-full transition-all group'>
            <Image className='w-6 h-6 text-gray-400 group-hover:text-blue-600 transition-colors' />
          </button>
          <div className='flex-1 relative'>
            <input
              type='text'
              placeholder='Nhập tin nhắn...'
              className='w-full bg-gray-100 rounded-full px-6 py-4 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all pr-12'
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={(e) =>
                e.key === 'Enter' && messageInput && handleSendMessage(chat.id)
              }
            />
            <button className='absolute right-3 top-1/2 transform -translate-y-1/2 p-2 hover:bg-gray-200 rounded-full transition-all'>
              <Smile className='w-5 h-5 text-gray-400' />
            </button>
          </div>
          <button
            onClick={() => handleSendMessage(chat.id)}
            disabled={!messageInput.trim()}
            className={`p-4 rounded-full transition-all shadow-lg ${
              messageInput.trim()
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-xl hover:scale-105'
                : 'bg-gray-200'
            }`}
          >
            <Send
              className={`w-5 h-5 ${
                messageInput.trim() ? 'text-white' : 'text-gray-400'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatDisplay;
