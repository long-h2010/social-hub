import { MicOffIcon } from 'lucide-react';
import { AudioBars } from '.';
import type { Ref } from 'react';
import React from 'react';

interface Props {
  ref?: Ref<HTMLDivElement>;
  name: string;
  avatar: string;
  isMuted: boolean;
  isVideoOff: boolean;
  speaking: boolean;
}

const VideoTile: React.FC<Props> = React.forwardRef<HTMLDivElement, Props>(
  (props, ref) => {
    const { name, avatar, isMuted, isVideoOff, speaking, ...rest } = props;

    // Kiểm tra avatar là URL ảnh hay emoji
    const isImageUrl = avatar && (avatar.startsWith('http') || avatar.startsWith('/') || avatar.startsWith('data:'));

    return (
      <div
        className='relative w-full h-full rounded-2xl overflow-hidden transition-shadow duration-[400ms]'
        style={{
          background: 'linear-gradient(135deg,#1a2235,#0e1117)',
          boxShadow: speaking
            ? '0 0 0 2px #34d399,0 0 0 4px rgba(52,211,153,0.12)'
            : 'none',
        }}
        {...rest}
      >
        {/* Video container — luôn tồn tại trong DOM để Agora có thể attach */}
        <div
          ref={ref}
          className='absolute inset-0'
          style={{ display: isVideoOff ? 'none' : 'block' }}
        />

        {/* Overlay khi tắt camera */}
        {isVideoOff && (
          <div className='absolute inset-0 flex flex-col items-center justify-center gap-3'>
            {/* Blurred avatar background */}
            {isImageUrl && (
              <div
                className='absolute inset-0'
                style={{
                  backgroundImage: `url(${avatar})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  filter: 'blur(24px) brightness(0.25) saturate(1.4)',
                  transform: 'scale(1.1)',
                }}
              />
            )}

            {/* Avatar chính giữa */}
            <div className='relative z-10 flex flex-col items-center gap-2.5'>
              <div
                className='rounded-full overflow-hidden border-2 border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.5)]'
                style={{
                  width: 'clamp(48px, 18%, 72px)',
                  height: 'clamp(48px, 18%, 72px)',
                }}
              >
                {isImageUrl ? (
                  <img
                    src={avatar}
                    alt={name}
                    className='w-full h-full object-cover'
                  />
                ) : (
                  <div
                    className='w-full h-full flex items-center justify-center text-3xl'
                    style={{ background: 'linear-gradient(135deg,#2d3748,#1a202c)' }}
                  >
                    {avatar}
                  </div>
                )}
              </div>
              <span className='text-white/60 text-[11px] font-medium tracking-wide'>
                {name}
              </span>
            </div>
          </div>
        )}

        {/* Bottom bar: tên + mic status */}
        <div
          className='absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 py-2 z-20'
          style={{
            background: 'linear-gradient(to top,rgba(0,0,0,0.65),transparent)',
          }}
        >
          <div className='flex items-center gap-1.5'>
            <AudioBars active={speaking && !isMuted} />
            <span className='text-white text-xs font-medium'>{name}</span>
          </div>
          {isMuted && (
            <span className='text-red-400 flex'>
              <MicOffIcon size={14} />
            </span>
          )}
        </div>
      </div>
    );
  },
);

export default VideoTile;
