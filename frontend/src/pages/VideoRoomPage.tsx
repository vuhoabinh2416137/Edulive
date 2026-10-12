import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Mic, MicOff, Video as VideoIcon, VideoOff, Monitor, Hand, 
  MessageSquare, Users, PhoneOff, Copy, Check, ShieldAlert,
  Send, AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWebRTC } from '../hooks/useWebRTC';
import { videoRoomService } from '../services/videoRoomService';
import { VideoRoom } from '../types/webrtc';

// Component hiển thị luồng Video độc lập với ref
const StreamPlayer: React.FC<{
  stream?: MediaStream | null;
  isMuted?: boolean;
  isMirrored?: boolean;
  name: string;
  isAudioOff?: boolean;
  isVideoOff?: boolean;
  isHandRaised?: boolean;
  isHost?: boolean;
  isSelf?: boolean;
}> = ({ stream, isMuted = false, isMirrored = false, name, isAudioOff = false, isVideoOff = false, isHandRaised = false, isHost = false, isSelf = false }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative w-full h-full min-h-[220px] bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-xl flex items-center justify-center group">
      {/* Video Element */}
      {stream && !isVideoOff ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isMuted}
          className={`w-full h-full object-cover ${isMirrored ? 'scale-x-[-1]' : ''}`}
        />
      ) : (
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-600 to-primary flex items-center justify-center text-white text-2xl font-bold shadow-lg ring-4 ring-indigo-500/20">
            {name.charAt(0).toUpperCase()}
          </div>
          <span className="text-slate-400 text-sm font-medium">Camera đang tắt</span>
        </div>
      )}

      {/* Overlay Tên & Badge */}
      <div className="absolute bottom-3 left-3 flex items-center space-x-2 bg-slate-950/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/50">
        <span className="text-xs font-semibold text-white tracking-wide">
          {name} {isSelf && '(Bạn)'}
        </span>
        {isHost && (
          <span className="text-[10px] bg-indigo-600/80 text-white font-medium px-1.5 py-0.5 rounded">
            Giảng viên
          </span>
        )}
      </div>

      {/* Trạng thái Mic góc trên */}
      <div className="absolute top-3 right-3 flex items-center space-x-1.5">
        {isHandRaised && (
          <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-lg animate-bounce" title="Đang giơ tay">
            <Hand size={16} />
          </div>
        )}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md border ${
          isAudioOff ? 'bg-red-500/80 text-white border-red-400/50' : 'bg-slate-950/60 text-slate-300 border-slate-700/50'
        }`}>
          {isAudioOff ? <MicOff size={14} /> : <Mic size={14} />}
        </div>
      </div>
    </div>
  );
};

export const VideoRoomPage: React.FC = () => {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [roomInfo, setRoomInfo] = useState<VideoRoom | null>(null);
  const [loadingRoom, setLoadingRoom] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeSidePanel, setActiveSidePanel] = useState<'none' | 'chat' | 'participants'>('none');
  const [chatInput, setChatInput] = useState('');

  const {
    localStream,
    participants,
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
    leaveRoom
  } = useWebRTC({ roomCode: roomCode || '' });

  // Tải thông tin phòng học
  useEffect(() => {
    if (!roomCode) return;
    const fetchRoom = async () => {
      try {
        const data = await videoRoomService.getRoomByCode(roomCode);
        setRoomInfo(data);
      } catch (err) {
        console.error('Không tìm thấy phòng học:', err);
      } finally {
        setLoadingRoom(false);
      }
    };
    fetchRoom();
  }, [roomCode]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLeave = () => {
    leaveRoom();
    navigate(-1);
  };

  const handleCloseRoom = async () => {
    if (!roomCode || !window.confirm('Bạn có chắc muốn kết thúc phòng học này cho tất cả mọi người?')) return;
    try {
      await videoRoomService.closeRoom(roomCode);
      handleLeave();
    } catch (e) {
      console.error('Lỗi khi đóng phòng:', e);
    }
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendChatMessage(chatInput.trim());
    setChatInput('');
  };

  const isHost = user && roomInfo && user.id === roomInfo.hostId;

  if (loadingRoom) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-medium">Đang chuẩn bị phòng học trực tuyến...</p>
        </div>
      </div>
    );
  }

  if (!roomInfo || !roomInfo.isLive) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 bg-red-500/10 text-red-400 rounded-2xl flex items-center justify-center mx-auto ring-8 ring-red-500/5">
            <ShieldAlert size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Phòng học đã kết thúc</h2>
            <p className="text-slate-400 text-sm">
              Buổi học trực tuyến này hiện không còn hoạt động hoặc mã phòng không chính xác.
            </p>
          </div>
          <button
            onClick={() => navigate('/courses')}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition"
          >
            Quay lại khóa học
          </button>
        </div>
      </div>
    );
  }

  const totalMembers = participants.length + 1; // + local user

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between overflow-hidden">
      {/* Top Header */}
      <header className="h-16 px-6 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 flex items-center justify-between z-10">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className={`w-3 h-3 rounded-full ${isConnected ? 'bg-red-500 animate-pulse' : 'bg-amber-500'}`}></span>
            <span className={`text-xs uppercase tracking-wider font-bold ${isConnected ? 'text-red-400' : 'text-amber-400'}`}>
              {isConnected ? 'TRỰC TIẾP' : 'ĐANG KẾT NỐI'}
            </span>
          </div>
          <div className="h-4 w-px bg-slate-800"></div>
          <h1 className="text-base font-semibold text-white truncate max-w-md">
            {roomInfo.title}
          </h1>
          <div className="flex items-center space-x-1.5 bg-slate-800/80 px-2.5 py-1 rounded-lg text-xs text-slate-300">
            <span className="font-mono font-medium">{roomCode}</span>
            <button
              onClick={handleCopyLink}
              title="Sao chép liên kết phòng"
              className="hover:text-indigo-400 transition"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {isHost && (
            <button
              onClick={handleCloseRoom}
              className="px-3.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-xs font-semibold transition"
            >
              Kết thúc lớp học
            </button>
          )}
          <div className="flex items-center space-x-1.5 bg-slate-800 px-3 py-1.5 rounded-xl text-xs text-slate-300">
            <Users size={14} className="text-indigo-400" />
            <span>{totalMembers} người tham gia</span>
          </div>
        </div>
      </header>

      {/* Main Video Stage & Side Panel */}
      <div className="flex-1 flex overflow-hidden p-4 gap-4 relative">
        {/* Stage Grid */}
        <div className="flex-1 flex flex-col justify-center items-center overflow-y-auto">
          {error && (
            <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-300 text-xs px-4 py-2 rounded-xl flex items-center space-x-2">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Grid hiển thị video tự thích ứng */}
          <div className={`w-full h-full max-h-[calc(100vh-160px)] grid gap-4 p-2 ${
            totalMembers === 1
              ? 'grid-cols-1 max-w-4xl'
              : totalMembers === 2
              ? 'grid-cols-1 md:grid-cols-2 max-w-5xl'
              : totalMembers <= 4
              ? 'grid-cols-1 sm:grid-cols-2 max-w-6xl'
              : 'grid-cols-2 md:grid-cols-3 max-w-7xl'
          }`}>
            {/* Local Video Stream */}
            <StreamPlayer
              stream={localStream}
              isMuted={true}
              isMirrored={!isScreenSharing}
              name={user?.fullName || 'Bạn'}
              isAudioOff={isAudioMuted}
              isVideoOff={isVideoMuted}
              isHandRaised={isHandRaised}
              isHost={isHost ?? false}
              isSelf={true}
            />

            {/* Remote Participants Video Streams */}
            {participants.map(p => (
              <StreamPlayer
                key={p.id}
                stream={p.stream}
                isMuted={false}
                name={p.name}
                isAudioOff={p.isAudioMuted}
                isVideoOff={p.isVideoMuted}
                isHandRaised={p.isHandRaised}
                isHost={p.id === roomInfo.hostId}
              />
            ))}
          </div>
        </div>

        {/* Side Panel (Chat hoặc Danh sách người tham gia) */}
        {activeSidePanel !== 'none' && (
          <aside className="w-80 md:w-96 bg-slate-900 border border-slate-800 rounded-3xl flex flex-col overflow-hidden shadow-2xl transition-all">
            {/* Side Panel Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-semibold text-sm text-white flex items-center space-x-2">
                {activeSidePanel === 'chat' ? (
                  <>
                    <MessageSquare size={16} className="text-indigo-400" />
                    <span>Hộp thoại lớp học</span>
                  </>
                ) : (
                  <>
                    <Users size={16} className="text-indigo-400" />
                    <span>Thành viên trong lớp ({totalMembers})</span>
                  </>
                )}
              </h3>
              <button
                onClick={() => setActiveSidePanel('none')}
                className="text-slate-400 hover:text-white text-xs font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Side Panel Content */}
            {activeSidePanel === 'chat' ? (
              <div className="flex-1 flex flex-col justify-between overflow-hidden">
                {/* Danh sách tin nhắn */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3">
                  {chatMessages.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 text-xs">
                      Chưa có tin nhắn nào. Hãy gửi lời chào đến mọi người!
                    </div>
                  ) : (
                    chatMessages.map(msg => (
                      <div
                        key={msg.id}
                        className={`p-3 rounded-2xl text-xs space-y-1 ${
                          msg.senderId === user?.id
                            ? 'bg-indigo-600/20 border border-indigo-500/30 text-white ml-6'
                            : 'bg-slate-800/80 border border-slate-700/40 text-slate-200 mr-6'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span className="font-medium text-indigo-300">{msg.senderName}</span>
                          <span>{msg.timestamp}</span>
                        </div>
                        <p className="leading-relaxed">{msg.content}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Form gửi tin nhắn */}
                <form onSubmit={handleSendChat} className="p-3 border-t border-slate-800 flex items-center space-x-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    placeholder="Nhập tin nhắn..."
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition"
                  >
                    <Send size={15} />
                  </button>
                </form>
              </div>
            ) : (
              /* Danh sách Người tham gia */
              <div className="flex-1 p-4 overflow-y-auto space-y-2">
                {/* Chính mình */}
                <div className="flex items-center justify-between p-2.5 bg-slate-800/40 rounded-xl border border-slate-700/30 text-xs">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
                      {user?.fullName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{user?.fullName} (Bạn)</p>
                      <p className="text-[10px] text-slate-400">{isHost ? 'Giảng viên' : 'Học viên'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1.5 text-slate-400">
                    {isHandRaised && <Hand size={14} className="text-amber-400" />}
                    {isAudioMuted ? <MicOff size={14} className="text-red-400" /> : <Mic size={14} />}
                  </div>
                </div>

                {/* Các peers khác */}
                {participants.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-2.5 bg-slate-800/20 rounded-xl border border-slate-700/20 text-xs">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-700 text-slate-200 flex items-center justify-center font-bold">
                        {p.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-white">{p.name}</p>
                        <p className="text-[10px] text-slate-400">
                          {p.id === roomInfo.hostId ? 'Giảng viên' : 'Học viên'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1.5 text-slate-400">
                      {p.isHandRaised && <Hand size={14} className="text-amber-400" />}
                      {p.isAudioMuted ? <MicOff size={14} className="text-red-400" /> : <Mic size={14} />}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </aside>
        )}
      </div>

      {/* Bottom Floating Control Bar */}
      <footer className="h-20 bg-slate-900/90 backdrop-blur-md border-t border-slate-800/80 px-6 flex items-center justify-center relative">
        <div className="flex items-center space-x-3">
          {/* Nút Mic */}
          <button
            onClick={toggleAudio}
            className={`p-3.5 rounded-2xl transition shadow-lg ${
              isAudioMuted
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
            title={isAudioMuted ? 'Bật Micro' : 'Tắt Micro'}
          >
            {isAudioMuted ? <MicOff size={20} /> : <Mic size={20} />}
          </button>

          {/* Nút Video Camera */}
          <button
            onClick={toggleVideo}
            className={`p-3.5 rounded-2xl transition shadow-lg ${
              isVideoMuted
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
            title={isVideoMuted ? 'Bật Camera' : 'Tắt Camera'}
          >
            {isVideoMuted ? <VideoOff size={20} /> : <VideoIcon size={20} />}
          </button>

          {/* Nút Chia sẻ màn hình */}
          <button
            onClick={toggleScreenShare}
            className={`p-3.5 rounded-2xl transition shadow-lg ${
              isScreenSharing
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
            title={isScreenSharing ? 'Dừng chia sẻ màn hình' : 'Chia sẻ màn hình'}
          >
            <Monitor size={20} />
          </button>

          {/* Nút Giơ tay */}
          <button
            onClick={toggleHandRaise}
            className={`p-3.5 rounded-2xl transition shadow-lg ${
              isHandRaised
                ? 'bg-amber-500 hover:bg-amber-600 text-white animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
            title={isHandRaised ? 'Hạ tay xuống' : 'Giơ tay phát biểu'}
          >
            <Hand size={20} />
          </button>

          {/* Nút Mở khung Chat */}
          <button
            onClick={() => setActiveSidePanel(prev => prev === 'chat' ? 'none' : 'chat')}
            className={`p-3.5 rounded-2xl transition shadow-lg relative ${
              activeSidePanel === 'chat'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
            title="Trò chuyện trong phòng"
          >
            <MessageSquare size={20} />
            {chatMessages.length > 0 && activeSidePanel !== 'chat' && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-indigo-400"></span>
            )}
          </button>

          {/* Nút Mở Người tham gia */}
          <button
            onClick={() => setActiveSidePanel(prev => prev === 'participants' ? 'none' : 'participants')}
            className={`p-3.5 rounded-2xl transition shadow-lg ${
              activeSidePanel === 'participants'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
            title="Danh sách người tham gia"
          >
            <Users size={20} />
          </button>

          {/* Nút Rời cuộc gọi */}
          <button
            onClick={handleLeave}
            className="px-5 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-semibold flex items-center space-x-2 transition shadow-lg shadow-red-600/30 ml-2"
            title="Rời khỏi phòng học"
          >
            <PhoneOff size={20} />
            <span className="hidden sm:inline text-xs font-bold uppercase tracking-wider">Rời phòng</span>
          </button>
        </div>
      </footer>
    </div>
  );
};
