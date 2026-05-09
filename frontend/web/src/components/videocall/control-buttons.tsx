import {
  MicOffIcon,
  MicIcon,
  VideoOffIcon,
  VideoIcon,
  ShareIcon,
  MoreHorizontal,
  PhoneIcon,
} from 'lucide-react';

interface CtrlBtnProps {
  onClick: () => void;
  label: string;
  danger?: boolean;
  inactive?: boolean;
  children: React.ReactNode;
}

function CtrlBtn({
  onClick,
  label,
  danger = false,
  inactive = false,
  children,
}: CtrlBtnProps) {
  return (
    <button
      onClick={onClick}
      className='group flex flex-col items-center gap-1.5 bg-transparent border-none cursor-pointer p-0 outline-none'
    >
      <span
        className={[
          'w-[46px] h-[46px] rounded-[14px] flex items-center justify-center transition-all duration-150',
          danger
            ? 'bg-red-500 hover:bg-red-400 text-white shadow-[0_4px_12px_rgba(239,68,68,0.2)] hover:shadow-[0_0_20px_rgba(239,68,68,0.45)] hover:scale-105'
            : inactive
              ? 'bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 hover:scale-105'
              : 'bg-[#1e2638] border border-white/[0.06] text-white hover:bg-[#2e374f] hover:scale-105',
        ].join(' ')}
      >
        {children}
      </span>
      <span className='text-[10px] text-white/30 group-hover:text-white/50 transition-colors'>
        {label}
      </span>
    </button>
  );
}

interface Props {
  connected: boolean; // true = đã kết nối
  muted: boolean;
  setMuted: (value: boolean) => void;
  videoOff: boolean;
  setVideoOff: (value: boolean) => void;
  sharing: boolean;
  setSharing: (value: boolean) => Promise<void>;
  handleEnd: () => void;
}

const ControlButtons: React.FC<Props> = ({
  connected,
  muted,
  setMuted,
  videoOff,
  setVideoOff,
  sharing,
  setSharing,
  handleEnd,
}) => {
  return (
    <div className='flex items-center justify-center gap-6 px-6 py-[18px] border-t border-white/[0.05]'>
      {/* Mic - luôn hiển thị */}
      <CtrlBtn
        onClick={() => setMuted(!muted)}
        inactive={muted}
        label={muted ? 'Bật mic' : 'Tắt mic'}
      >
        {muted ? <MicOffIcon size={18} /> : <MicIcon size={18} />}
      </CtrlBtn>

      {/* Camera - luôn hiển thị */}
      <CtrlBtn
        onClick={() => setVideoOff(!videoOff)}
        inactive={videoOff}
        label={videoOff ? 'Bật cam' : 'Tắt cam'}
      >
        {videoOff ? <VideoOffIcon size={18} /> : <VideoIcon size={18} />}
      </CtrlBtn>

      {/* Share màn hình - chỉ khi connected */}
      {connected && (
        <CtrlBtn
          onClick={() => setSharing(!sharing)}
          inactive={sharing}
          label={sharing ? 'Dừng chia sẻ' : 'Màn hình'}
        >
          <ShareIcon size={18} />
        </CtrlBtn>
      )}

      {/* Thêm - chỉ khi connected */}
      {connected && (
        <CtrlBtn onClick={() => {}} label='Thêm'>
          <MoreHorizontal size={18} />
        </CtrlBtn>
      )}

      {/* Kết thúc - luôn hiển thị */}
      <CtrlBtn onClick={handleEnd} danger label='Kết thúc'>
        <span className='rotate-[135deg] inline-flex'>
          <PhoneIcon size={18} />
        </span>
      </CtrlBtn>
    </div>
  );
};

export default ControlButtons;
