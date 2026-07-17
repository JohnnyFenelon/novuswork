import { useEffect, useRef, useState } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff } from 'lucide-react';
import { getSocket } from '../realtime';

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }],
};

export interface IncomingCall {
  from: number;
  fromName: string;
  sdp: RTCSessionDescriptionInit;
}

interface Props {
  /** Set for outgoing calls: the user id to call. */
  callee?: { id: number; name: string } | null;
  /** Set for incoming calls (received via socket). */
  incoming?: IncomingCall | null;
  myName: string;
  onClose: () => void;
}

/** Full-screen WebRTC call overlay. Signaling is relayed through Socket.IO. */
export default function VideoCall({ callee, incoming, myName, onClose }: Props) {
  const localRef = useRef<HTMLVideoElement>(null);
  const remoteRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState(incoming ? 'Incoming call…' : 'Calling…');
  const [connected, setConnected] = useState(false);
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [accepted, setAccepted] = useState(!incoming); // outgoing starts immediately
  const otherId = incoming ? incoming.from : callee?.id;

  useEffect(() => {
    if (!accepted || !otherId) return;
    const socket = getSocket();
    let closed = false;

    const cleanup = () => {
      if (closed) return;
      closed = true;
      pcRef.current?.close();
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (closed) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (localRef.current) localRef.current.srcObject = stream;

        const pc = new RTCPeerConnection(RTC_CONFIG);
        pcRef.current = pc;
        stream.getTracks().forEach((t) => pc.addTrack(t, stream));

        pc.ontrack = (e) => {
          if (remoteRef.current && e.streams[0]) {
            remoteRef.current.srcObject = e.streams[0];
            setConnected(true);
            setStatus('Connected');
          }
        };
        pc.onicecandidate = (e) => {
          if (e.candidate) socket.emit('ice-candidate', { to: otherId, candidate: e.candidate });
        };
        pc.onconnectionstatechange = () => {
          if (['failed', 'disconnected', 'closed'].includes(pc.connectionState)) {
            setStatus('Call ended');
            setTimeout(onClose, 800);
          }
        };

        socket.on('ice-candidate', ({ from, candidate }) => {
          if (from === otherId && candidate) pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
        });

        if (incoming) {
          await pc.setRemoteDescription(new RTCSessionDescription(incoming.sdp));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('call-answer', { to: otherId, sdp: answer });
        } else {
          socket.on('call-answer', async ({ from, sdp }) => {
            if (from === otherId) await pc.setRemoteDescription(new RTCSessionDescription(sdp));
          });
          socket.on('call-unavailable', () => {
            setStatus('User is not online');
            setTimeout(onClose, 1500);
          });
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('call-offer', { to: otherId, sdp: offer, fromName: myName });
        }

        socket.on('call-end', ({ from }) => {
          if (from === otherId) {
            setStatus('Call ended');
            cleanup();
            setTimeout(onClose, 800);
          }
        });
      } catch {
        setStatus('Could not access camera/microphone');
        setTimeout(onClose, 2000);
      }
    })();

    return () => {
      socket.off('call-answer');
      socket.off('ice-candidate');
      socket.off('call-end');
      socket.off('call-unavailable');
      cleanup();
    };
  }, [accepted, otherId]);

  const hangUp = () => {
    if (otherId) getSocket().emit('call-end', { to: otherId });
    onClose();
  };

  const toggleMute = () => {
    streamRef.current?.getAudioTracks().forEach((t) => (t.enabled = muted));
    setMuted(!muted);
  };
  const toggleVideo = () => {
    streamRef.current?.getVideoTracks().forEach((t) => (t.enabled = videoOff));
    setVideoOff(!videoOff);
  };

  const otherName = incoming ? incoming.fromName || 'NovusWork user' : callee?.name || '';

  // Incoming-call accept screen
  if (incoming && !accepted) {
    return (
      <div className="fixed inset-0 z-[200] bg-dark/95 flex items-center justify-center p-4">
        <div className="text-center text-white">
          <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Phone className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold mb-1">{otherName}</h2>
          <p className="text-gray-400 mb-8">Incoming video call…</p>
          <div className="flex gap-4 justify-center">
            <button onClick={() => setAccepted(true)}
              className="bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-full font-bold flex items-center gap-2">
              <Phone className="w-5 h-5" /> Accept
            </button>
            <button onClick={() => { getSocket().emit('call-end', { to: incoming.from }); onClose(); }}
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-full font-bold flex items-center gap-2">
              <PhoneOff className="w-5 h-5" /> Decline
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] bg-dark flex flex-col">
      <div className="flex-1 relative">
        <video ref={remoteRef} autoPlay playsInline className="w-full h-full object-cover" />
        {!connected && (
          <div className="absolute inset-0 flex items-center justify-center text-white">
            <div className="text-center">
              <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Video className="w-8 h-8" />
              </div>
              <p className="font-semibold text-lg">{otherName}</p>
              <p className="text-gray-400 text-sm">{status}</p>
            </div>
          </div>
        )}
        <video ref={localRef} autoPlay playsInline muted
          className="absolute bottom-24 right-4 w-36 sm:w-48 aspect-video object-cover rounded-xl border-2 border-white/20 shadow-lg" />
      </div>

      <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4">
        <button onClick={toggleMute} className={`w-14 h-14 rounded-full flex items-center justify-center ${muted ? 'bg-white text-dark' : 'bg-white/15 text-white hover:bg-white/25'}`}>
          {muted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>
        <button onClick={hangUp} className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center">
          <PhoneOff className="w-6 h-6" />
        </button>
        <button onClick={toggleVideo} className={`w-14 h-14 rounded-full flex items-center justify-center ${videoOff ? 'bg-white text-dark' : 'bg-white/15 text-white hover:bg-white/25'}`}>
          {videoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
        </button>
      </div>
    </div>
  );
}
