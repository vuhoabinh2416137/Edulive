import { api } from './api';
import { VideoRoom, IceServerConfig } from '../types/webrtc';

export const videoRoomService = {
  createRoom: async (courseId: number, title: string): Promise<VideoRoom> => {
    const response = await api.post<VideoRoom>('/video-rooms', { courseId, title });
    return response.data;
  },

  getRoomByCode: async (roomCode: string): Promise<VideoRoom> => {
    const response = await api.get<VideoRoom>(`/video-rooms/${roomCode}`);
    return response.data;
  },

  getRoomsByCourse: async (courseId: number): Promise<VideoRoom[]> => {
    const response = await api.get<VideoRoom[]>(`/courses/${courseId}/video-rooms`);
    return response.data;
  },

  closeRoom: async (roomCode: string): Promise<void> => {
    await api.put(`/video-rooms/${roomCode}/close`);
  },

  getIceServers: async (): Promise<IceServerConfig[]> => {
    try {
      const response = await api.get<IceServerConfig[]>('/video-rooms/ice-servers');
      return response.data;
    } catch {
      return [{ urls: 'stun:stun.l.google.com:19302' }];
    }
  }
};
