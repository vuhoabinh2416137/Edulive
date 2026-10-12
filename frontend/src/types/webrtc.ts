export interface VideoRoom {
  id: number;
  courseId: number;
  roomCode: string;
  title: string;
  isLive: boolean;
  createdAt: string;
  endedAt?: string;
  hostId: number;
  hostName: string;
}

export interface IceServerConfig {
  urls: string;
  username?: string;
  credential?: string;
}

export interface SignalMessage {
  type: 'JOIN' | 'OFFER' | 'ANSWER' | 'ICE_CANDIDATE' | 'LEAVE' | 'TOGGLE_MEDIA' | 'HAND_RAISE' | 'CHAT';
  senderId: number;
  senderName: string;
  targetId?: number | null;
  payload?: any;
}

export interface RoomParticipant {
  id: number;
  name: string;
  stream?: MediaStream;
  isAudioMuted: boolean;
  isVideoMuted: boolean;
  isHandRaised: boolean;
  isHost?: boolean;
}

export interface RoomChatMessage {
  id: string;
  senderId: number;
  senderName: string;
  content: string;
  timestamp: string;
}
