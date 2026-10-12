import { useEffect, useRef, useState, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import { useAuth } from '../context/AuthContext';
import { videoRoomService } from '../services/videoRoomService';
import { SignalMessage, RoomParticipant, RoomChatMessage } from '../types/webrtc';

interface UseWebRTCOptions {
  roomCode: string;
  autoJoin?: boolean;
}

export function useWebRTC({ roomCode, autoJoin = true }: UseWebRTCOptions) {
  const { user } = useAuth();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [participants, setParticipants] = useState<Map<number, RoomParticipant>>(new Map());
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [chatMessages, setChatMessages] = useState<RoomChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stompClientRef = useRef<Client | null>(null);
  const peerConnectionsRef = useRef<Map<number, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const originalCamStreamRef = useRef<MediaStream | null>(null);
  const iceServersRef = useRef<RTCIceServer[]>([
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]);

  // Tạo dummy media stream cho trường hợp thiết bị không có webcam/mic thực tế
  const createDummyMediaStream = useCallback((): MediaStream => {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, 640, 480);
      ctx.fillStyle = '#38bdf8';
      ctx.font = '24px sans-serif';
      ctx.fillText(user?.fullName || 'Người tham gia', 180, 240);
    }
    const canvasStream = canvas.captureStream(15);
    
    // Tạo audio track câm
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const dst = audioCtx.createMediaStreamDestination();
    osc.connect(dst);
    const audioTrack = dst.stream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = false;
      canvasStream.addTrack(audioTrack);
    }
    return canvasStream;
  }, [user]);

  // Khởi tạo Local Media Stream
  const initLocalStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true
      });
      setLocalStream(stream);
      localStreamRef.current = stream;
      originalCamStreamRef.current = stream;
      return stream;
    } catch (err: any) {
      console.warn('Không thể truy cập camera/mic thực tế, tạo dummy stream để kiểm thử:', err);
      const dummy = createDummyMediaStream();
      setLocalStream(dummy);
      localStreamRef.current = dummy;
      originalCamStreamRef.current = dummy;
      return dummy;
    }
  }, [createDummyMediaStream]);

  // Gửi Signal message qua STOMP
  const sendSignal = useCallback((type: SignalMessage['type'], payload?: any, targetId?: number | null) => {
    if (!stompClientRef.current?.connected || !user) return;
    const msg: SignalMessage = {
      type,
      senderId: user.id,
      senderName: user.fullName,
      targetId: targetId ?? null,
      payload
    };
    stompClientRef.current.publish({
      destination: `/app/webrtc/${roomCode}/signal`,
      body: JSON.stringify(msg)
    });
  }, [roomCode, user]);

  // Tạo RTCPeerConnection cho một peer cụ thể
  const createPeerConnection = useCallback((remoteUserId: number, remoteUserName: string): RTCPeerConnection => {
    const pc = new RTCPeerConnection({
      iceServers: iceServersRef.current
    });

    // Thêm các track local vào peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // Lắng nghe ICE Candidate
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal('ICE_CANDIDATE', event.candidate, remoteUserId);
      }
    };

    // Lắng nghe track từ remote
    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      if (remoteStream) {
        setParticipants(prev => {
          const next = new Map(prev);
          const existing = next.get(remoteUserId) || {
            id: remoteUserId,
            name: remoteUserName,
            isAudioMuted: false,
            isVideoMuted: false,
            isHandRaised: false
          };
          next.set(remoteUserId, {
            ...existing,
            stream: remoteStream
          });
          return next;
        });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        setParticipants(prev => {
          const next = new Map(prev);
          next.delete(remoteUserId);
          return next;
        });
      }
    };

    peerConnectionsRef.current.set(remoteUserId, pc);
    return pc;
  }, [sendSignal]);

  // Xử lý thông điệp signaling nhận được
  const handleSignalMessage = useCallback(async (msg: SignalMessage) => {
    if (!user || msg.senderId === user.id) return; // Bỏ qua tin nhắn từ chính mình

    // Nếu message có chỉ định targetId mà không phải mình thì bỏ qua
    if (msg.targetId && msg.targetId !== user.id) return;

    switch (msg.type) {
      case 'JOIN': {
        // Peer mới gia nhập phòng -> Tạo Offer gửi cho họ
        setParticipants(prev => {
          const next = new Map(prev);
          if (!next.has(msg.senderId)) {
            next.set(msg.senderId, {
              id: msg.senderId,
              name: msg.senderName,
              isAudioMuted: false,
              isVideoMuted: false,
              isHandRaised: false
            });
          }
          return next;
        });

        const pc = createPeerConnection(msg.senderId, msg.senderName);
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          sendSignal('OFFER', offer, msg.senderId);
        } catch (e) {
          console.error('Lỗi khi tạo offer cho peer:', msg.senderId, e);
        }
        break;
      }

      case 'OFFER': {
        // Nhận Offer từ peer -> Tạo Answer gửi lại
        let pc = peerConnectionsRef.current.get(msg.senderId);
        if (!pc) {
          pc = createPeerConnection(msg.senderId, msg.senderName);
        }
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(msg.payload));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          sendSignal('ANSWER', answer, msg.senderId);
        } catch (e) {
          console.error('Lỗi khi xử lý offer và tạo answer:', e);
        }
        break;
      }

      case 'ANSWER': {
        // Nhận Answer từ peer
        const pc = peerConnectionsRef.current.get(msg.senderId);
        if (pc) {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(msg.payload));
          } catch (e) {
            console.error('Lỗi khi setRemoteDescription từ answer:', e);
          }
        }
        break;
      }

      case 'ICE_CANDIDATE': {
        const pc = peerConnectionsRef.current.get(msg.senderId);
        if (pc && msg.payload) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(msg.payload));
          } catch (e) {
            console.error('Lỗi khi addIceCandidate:', e);
          }
        }
        break;
      }

      case 'LEAVE': {
        const pc = peerConnectionsRef.current.get(msg.senderId);
        if (pc) {
          pc.close();
          peerConnectionsRef.current.delete(msg.senderId);
        }
        setParticipants(prev => {
          const next = new Map(prev);
          next.delete(msg.senderId);
          return next;
        });
        break;
      }

      case 'TOGGLE_MEDIA': {
        setParticipants(prev => {
          const next = new Map(prev);
          const current = next.get(msg.senderId);
          if (current) {
            next.set(msg.senderId, {
              ...current,
              isAudioMuted: msg.payload?.isAudioMuted ?? current.isAudioMuted,
              isVideoMuted: msg.payload?.isVideoMuted ?? current.isVideoMuted
            });
          }
          return next;
        });
        break;
      }

      case 'HAND_RAISE': {
        setParticipants(prev => {
          const next = new Map(prev);
          const current = next.get(msg.senderId);
          if (current) {
            next.set(msg.senderId, {
              ...current,
              isHandRaised: !!msg.payload?.isHandRaised
            });
          }
          return next;
        });
        break;
      }

      case 'CHAT': {
        if (msg.payload?.content) {
          const chatItem: RoomChatMessage = {
            id: String(Date.now()) + Math.random().toString(36).substring(2, 5),
            senderId: msg.senderId,
            senderName: msg.senderName,
            content: msg.payload.content,
            timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
          };
          setChatMessages(prev => [...prev, chatItem]);
        }
        break;
      }
    }
  }, [user, createPeerConnection, sendSignal]);

  // Kết nối STOMP & WebRTC
  const joinRoom = useCallback(async () => {
    if (!user || stompClientRef.current?.connected) return;

    try {
      // 1. Tải ICE Servers
      const configs = await videoRoomService.getIceServers();
      if (configs.length > 0) {
        iceServersRef.current = configs.map(c => ({
          urls: c.urls,
          username: c.username,
          credential: c.credential
        }));
      }

      // 2. Lấy Local Media
      await initLocalStream();

      // 3. Khởi tạo STOMP Client
      const token = localStorage.getItem('token');
      const wsUrl = (window.location.protocol === 'https:' ? 'wss://' : 'ws://') +
        (window.location.host.includes(':') ? window.location.hostname + ':8088' : window.location.host) + '/ws';

      const client = new Client({
        brokerURL: wsUrl,
        connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
        debug: (str) => {
          if (process.env.NODE_ENV === 'development') {
            console.log('[WebRTC Signaling]', str);
          }
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000
      });

      client.onConnect = () => {
        setIsConnected(true);
        setError(null);

        // Đăng ký nhận tín hiệu phòng
        client.subscribe(`/topic/room/${roomCode}/signal`, (frame) => {
          try {
            const signal: SignalMessage = JSON.parse(frame.body);
            handleSignalMessage(signal);
          } catch (e) {
            console.error('Lỗi parse signal message:', e);
          }
        });

        // Báo cho mọi người biết mình vừa tham gia (JOIN)
        sendSignal('JOIN');
      };

      client.onStompError = (frame) => {
        console.error('STOMP Error:', frame);
        setError('Lỗi kết nối máy chủ phòng học');
      };

      client.activate();
      stompClientRef.current = client;
    } catch (err: any) {
      console.error('Lỗi khi tham gia phòng WebRTC:', err);
      setError(err.message || 'Không thể tham gia phòng');
    }
  }, [user, roomCode, initLocalStream, handleSignalMessage, sendSignal]);

  // Rời phòng
  const leaveRoom = useCallback(() => {
    sendSignal('LEAVE');

    // Đóng toàn bộ peer connections
    peerConnectionsRef.current.forEach(pc => pc.close());
    peerConnectionsRef.current.clear();

    // Dừng toàn bộ tracks của local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    // Đóng STOMP client
    if (stompClientRef.current?.active) {
      stompClientRef.current.deactivate();
      stompClientRef.current = null;
    }

    setLocalStream(null);
    setParticipants(new Map());
    setIsConnected(false);
  }, [sendSignal]);

  // Toggle Micro
  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        const newMuted = !audioTrack.enabled;
        setIsAudioMuted(newMuted);
        sendSignal('TOGGLE_MEDIA', { isAudioMuted: newMuted, isVideoMuted });
      }
    }
  }, [isVideoMuted, sendSignal]);

  // Toggle Camera
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        const newMuted = !videoTrack.enabled;
        setIsVideoMuted(newMuted);
        sendSignal('TOGGLE_MEDIA', { isAudioMuted, isVideoMuted: newMuted });
      }
    }
  }, [isAudioMuted, sendSignal]);

  // Toggle Screen Sharing
  const toggleScreenShare = useCallback(async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];

        // Thay thế video track gửi tới tất cả peers
        peerConnectionsRef.current.forEach(pc => {
          const sender = pc.getSenders().find(s => s.track?.kind === 'video');
          if (sender) {
            sender.replaceTrack(screenTrack);
          }
        });

        // Cập nhật local preview
        setLocalStream(screenStream);
        localStreamRef.current = screenStream;
        setIsScreenSharing(true);

        // Khi người dùng bấm dừng chia sẻ trên trình duyệt
        screenTrack.onended = () => {
          stopScreenShare();
        };
      } catch (e) {
        console.warn('Hủy hoặc lỗi chia sẻ màn hình:', e);
      }
    } else {
      stopScreenShare();
    }
  }, [isScreenSharing]);

  const stopScreenShare = useCallback(() => {
    if (originalCamStreamRef.current) {
      const camVideoTrack = originalCamStreamRef.current.getVideoTracks()[0];
      peerConnectionsRef.current.forEach(pc => {
        const sender = pc.getSenders().find(s => s.track?.kind === 'video');
        if (sender && camVideoTrack) {
          sender.replaceTrack(camVideoTrack);
        }
      });
      setLocalStream(originalCamStreamRef.current);
      localStreamRef.current = originalCamStreamRef.current;
    }
    setIsScreenSharing(false);
  }, []);

  // Giơ tay xin phát biểu
  const toggleHandRaise = useCallback(() => {
    const nextState = !isHandRaised;
    setIsHandRaised(nextState);
    sendSignal('HAND_RAISE', { isHandRaised: nextState });
  }, [isHandRaised, sendSignal]);

  // Gửi tin nhắn chat trong phòng
  const sendChatMessage = useCallback((content: string) => {
    if (!content.trim() || !user) return;
    const msgItem: RoomChatMessage = {
      id: String(Date.now()),
      senderId: user.id,
      senderName: user.fullName,
      content,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages(prev => [...prev, msgItem]);
    sendSignal('CHAT', { content });
  }, [user, sendSignal]);

  useEffect(() => {
    if (autoJoin) {
      joinRoom();
    }
    return () => {
      leaveRoom();
    };
  }, [autoJoin, joinRoom, leaveRoom]);

  return {
    localStream,
    participants: Array.from(participants.values()),
    isAudioMuted,
    isVideoMuted,
    isScreenSharing,
    isHandRaised,
    chatMessages,
    isConnected,
    error,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    toggleHandRaise,
    sendChatMessage,
    leaveRoom,
    joinRoom
  };
}
