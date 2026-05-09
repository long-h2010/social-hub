import { useState, useEffect, useRef, useCallback } from 'react';
import type { User } from '../../types/user';
import useTimer from '../../hooks/use-timer';
import { useCall } from '../../contexts/call-context';
import { ControlButtons, PopupHeader, VideoArea } from './';
import AgoraRTC from 'agora-rtc-sdk-ng';
import type {
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
  IMicrophoneAudioTrack,
  ICameraVideoTrack,
  ILocalVideoTrack,
} from 'agora-rtc-sdk-ng';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  callee: User;
  minimized: boolean;
  onMinimize: () => void;
  onExpand: () => void;
}

const APP_ID = import.meta.env.VITE_APP_AGORA_ID;
const AGORA_CLIENT = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

const CallPopup: React.FC<Props> = ({
  isOpen,
  onClose,
  callee,
  minimized,
  onMinimize,
}) => {
  const clientRef = useRef<IAgoraRTCClient | null>(null);

  // Lưu riêng audio và video track để có thể bật/tắt
  const localAudioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
  const localVideoTrackRef = useRef<ICameraVideoTrack | null>(null);
  const screenTrackRef = useRef<ILocalVideoTrack | null>(null);

  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);

  const [remoteUser, setRemoteUser] = useState<IAgoraRTCRemoteUser | null>(null);

  const { incomingCall, callStatus, setCallStatus } = useCall();
  const [muted, setMutedState] = useState<boolean>(false);
  const [videoOff, setVideoOffState] = useState<boolean>(false);
  const [sharing, setSharingState] = useState<boolean>(false);
  const [visible, setVisible] = useState<boolean>(false);

  // "connecting" = true khi đang đổ chuông / chờ kết nối
  // "connected"  = true sau khi in-call và join xong
  const [connected, setConnected] = useState<boolean>(false);

  // Timer chỉ chạy khi đã connected
  const timer = useTimer(connected);

  // Khi callStatus chuyển sang 'in-call' => bắt đầu join Agora
  useEffect(() => {
    if (callStatus === 'in-call') {
      startCall();
    }
  }, [callStatus]);

  // Khởi tạo AGORA_CLIENT listeners
  useEffect(() => {
    clientRef.current = AGORA_CLIENT;

    AGORA_CLIENT.on('user-published', async (user: IAgoraRTCRemoteUser, mediaType) => {
      await AGORA_CLIENT.subscribe(user, mediaType);
      if (mediaType === 'video') {
        setRemoteUser(user);
      }
      if (mediaType === 'audio' && user.audioTrack) {
        user.audioTrack.play();
      }
    });

    AGORA_CLIENT.on('user-unpublished', (user) => {
      if (remoteUser?.uid === user.uid) setRemoteUser(null);
    });

    AGORA_CLIENT.on('user-left', () => {
      setRemoteUser(null);
      handleEnd();
    });

    return () => {
      AGORA_CLIENT.removeAllListeners();
    };
  }, [onClose]);

  // Phát video remote khi có
  useEffect(() => {
    if (remoteUser?.videoTrack && remoteVideoRef.current) {
      remoteUser.videoTrack.play(remoteVideoRef.current);
    }
  }, [remoteUser]);

  // Phát video local khi có
  useEffect(() => {
    if (localVideoTrackRef.current && localVideoRef.current) {
      localVideoTrackRef.current.play(localVideoRef.current);
    }
  }, [connected]);

  // Join channel & publish tracks
  const startCall = useCallback(async () => {
    if (!clientRef.current) return;

    if (!incomingCall?.channel || !incomingCall?.token || !incomingCall?.uid) {
      console.error('No incoming call data available');
      return;
    }

    try {
      await clientRef.current.join(
        APP_ID,
        incomingCall.channel,
        incomingCall.token,
        incomingCall.uid,
      );

      const localAudio = await AgoraRTC.createMicrophoneAudioTrack();
      const localVideo = await AgoraRTC.createCameraVideoTrack();

      localAudioTrackRef.current = localAudio;
      localVideoTrackRef.current = localVideo;

      await clientRef.current.publish([localAudio, localVideo]);

      // Sau khi publish xong mới coi là connected
      setConnected(true);

      if (localVideoRef.current) {
        localVideo.play(localVideoRef.current);
      }
    } catch (err) {
      console.error('Start Agora call failed:', err);
    }
  }, [APP_ID, incomingCall?.channel, incomingCall?.token, incomingCall?.uid]);

  // Leave call & dọn dẹp tracks
  const endCall = useCallback(async () => {
    // Dừng và đóng screen share nếu đang share
    if (screenTrackRef.current) {
      screenTrackRef.current.stop();
      screenTrackRef.current.close();
      screenTrackRef.current = null;
    }

    // Dừng và đóng local tracks
    if (localAudioTrackRef.current) {
      localAudioTrackRef.current.stop();
      localAudioTrackRef.current.close();
      localAudioTrackRef.current = null;
    }
    if (localVideoTrackRef.current) {
      localVideoTrackRef.current.stop();
      localVideoTrackRef.current.close();
      localVideoTrackRef.current = null;
    }

    if (clientRef.current) {
      await clientRef.current.leave();
    }

    setRemoteUser(null);
    setConnected(false);
    onClose?.();
  }, [onClose]);

  // Reset state khi popup mở
  useEffect(() => {
    if (isOpen) {
      setMutedState(false);
      setVideoOffState(false);
      setSharingState(false);
      setConnected(false);

      const t = setTimeout(() => setVisible(true), 10);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
    }
  }, [isOpen]);

  // ─── Handlers có thực tế điều khiển Agora tracks ───────────────────────────

  const handleSetMuted = (value: boolean) => {
    setMutedState(value);
    if (localAudioTrackRef.current) {
      localAudioTrackRef.current.setEnabled(!value);
    }
  };

  const handleSetVideoOff = async (value: boolean) => {
    setVideoOffState(value);
    if (!localVideoTrackRef.current) return;

    await localVideoTrackRef.current.setEnabled(!value);

    // Sau khi bật lại cam, Agora đã detach khỏi div → cần play lại
    if (!value && localVideoRef.current) {
      localVideoTrackRef.current.play(localVideoRef.current);
    }
  };

  const handleSetSharing = async (value: boolean) => {
    if (!clientRef.current) return;

    if (value) {
      // Bắt đầu share màn hình
      try {
        const screenTrack = await AgoraRTC.createScreenVideoTrack(
          { encoderConfig: '1080p_1' },
          'disable',
        ) as ILocalVideoTrack;

        screenTrackRef.current = screenTrack;

        // Unpublish camera, publish screen
        if (localVideoTrackRef.current) {
          await clientRef.current.unpublish(localVideoTrackRef.current);
        }
        await clientRef.current.publish(screenTrack);

        // Phát preview local
        if (localVideoRef.current) {
          screenTrack.play(localVideoRef.current);
        }

        // Tự động tắt sharing khi user dừng từ browser
        (screenTrack as any).on?.('track-ended', () => {
          handleSetSharing(false);
        });

        setSharingState(true);
      } catch (err) {
        console.error('Screen share failed:', err);
      }
    } else {
      // Dừng share màn hình, quay về camera
      if (screenTrackRef.current) {
        await clientRef.current.unpublish(screenTrackRef.current);
        screenTrackRef.current.stop();
        screenTrackRef.current.close();
        screenTrackRef.current = null;
      }

      if (localVideoTrackRef.current) {
        await clientRef.current.publish(localVideoTrackRef.current);
        if (localVideoRef.current) {
          localVideoTrackRef.current.play(localVideoRef.current);
        }
      }

      setSharingState(false);
    }
  };

  const handleEnd = () => {
    setCallStatus('idle');
    setVisible(false);
    endCall();
    setTimeout(onClose, 280);
  };

  if (!isOpen) return null;
  if (minimized) return null;

  return (
    <div
      className='fixed inset-0 z-[50000] flex items-center justify-center transition-opacity duration-300'
      style={{
        backdropFilter: 'blur(14px)',
        background: 'rgba(0,0,0,0.72)',
        opacity: visible ? 1 : 0,
      }}
    >
      <div
        className='w-[760px] max-w-[94vw] bg-[#0e1117] rounded-[28px] overflow-hidden border border-white/[0.06] shadow-[0_40px_80px_rgba(0,0,0,0.7)]'
        style={{ animation: 'vcModalIn 0.35s cubic-bezier(0.34,1.56,0.64,1)' }}
      >
        <PopupHeader
          connected={connected}
          sharing={sharing}
          timer={timer}
          onMinimize={onMinimize}
          handleEnd={handleEnd}
        />

        <VideoArea
          localRef={localVideoRef}
          remoteRef={remoteVideoRef}
          callee={callee}
          connected={connected}
          muted={muted}
          videoOff={videoOff}
        />

        <ControlButtons
          connected={connected}
          muted={muted}
          setMuted={handleSetMuted}
          videoOff={videoOff}
          setVideoOff={handleSetVideoOff}
          sharing={sharing}
          setSharing={handleSetSharing}
          handleEnd={handleEnd}
        />
      </div>
    </div>
  );
};

export default CallPopup;
