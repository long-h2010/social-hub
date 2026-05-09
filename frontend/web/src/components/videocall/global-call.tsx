import { useEffect, useState } from 'react';
import { CallPopup, IncomingCall, MinimizedPill } from '.';
import { useCall } from '../../contexts/call-context';
import { useSocket } from '../../contexts/socket-context';
import { useAuth } from '../../contexts/auth-context';
import useTimer from '../../hooks/use-timer';

const GlobalCall = () => {
  const { callStatus, setCallStatus, callee, setCallee, incomingCall } =
    useCall();
  const { socket } = useSocket();
  const { user } = useAuth();

  const [openCallPopup, setOpenCallPopup] = useState<boolean>(false);
  const [openRingingPopup, setOpenRingingPopup] = useState<boolean>(false);
  const [minimized, setMinimized] = useState<boolean>(false);

  const isConnected = callStatus === 'in-call';
  const timer = useTimer(isConnected);

  useEffect(() => {
    if (callStatus === 'calling' || callStatus === 'in-call') {
      setOpenRingingPopup(false);
      setOpenCallPopup(true);
    } else if (callStatus === 'ringing') {
      setOpenRingingPopup(true);
      setOpenCallPopup(false);
    } else {
      setOpenCallPopup(false);
      setOpenRingingPopup(false);
      setMinimized(false);
    }
  }, [callStatus]);

  const onAccept = () => {
    setCallStatus('in-call');
    setCallee(incomingCall?.caller);

    socket?.emit('accept-call', {
      caller: incomingCall?.caller,
      callee: user._id,
      channel: incomingCall?.channel,
    });
  };

  const onClose = () => {
    setCallStatus('idle');
    setMinimized(false);

    socket?.emit('end-call', {
      user: callee?.id,
      channel: incomingCall?.channel,
    });
  };

  const handleMinimize = () => {
    setMinimized(true);
  };

  const handleExpand = () => {
    setMinimized(false);
  };

  return (
    <>
      {openCallPopup && incomingCall && (
        <CallPopup
          isOpen={true}
          onClose={onClose}
          callee={callee}
          minimized={minimized}
          onMinimize={handleMinimize}
          onExpand={handleExpand}
        />
      )}

      {minimized && openCallPopup && callee && (
        <MinimizedPill
          callee={callee}
          timer={timer}
          onExpand={handleExpand}
          onEnd={onClose}
        />
      )}

      {openRingingPopup && (
        <IncomingCall
          caller={incomingCall?.caller}
          onAccept={onAccept}
          onDecline={onClose}
          visible={true}
        />
      )}
    </>
  );
};

export default GlobalCall;
