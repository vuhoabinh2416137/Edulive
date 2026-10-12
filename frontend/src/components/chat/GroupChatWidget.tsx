import React, { useState, useEffect, useRef } from 'react';
import { chatService } from '../../services/chatService';
import { ChatMessage } from '../../types/chat';
import { useAuth } from '../../context/AuthContext';
import { Client } from '@stomp/stompjs';
import { 
  MessageCircle, 
  X, 
  Send, 
  Users, 
  Loader2
} from 'lucide-react';

interface Props {
  courseId: number;
  courseTitle?: string;
}

export const GroupChatWidget: React.FC<Props> = ({ courseId, courseTitle }) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const stompClientRef = useRef<Client | null>(null);

  // Cuộn xuống tin nhắn mới nhất
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  // Load tin nhắn ban đầu khi component mount
  useEffect(() => {
    if (!courseId) return;

    chatService.getRecentMessages(courseId)
      .then(setMessages)
      .catch((err) => console.error('Failed to load chat history:', err));
  }, [courseId]);

  // Thiết lập STOMP WebSocket client
  useEffect(() => {
    if (!courseId) return;

    const token = localStorage.getItem('token');
    const wsUrl = 'ws://localhost:8088/ws';

    const client = new Client({
      brokerURL: wsUrl,
      connectHeaders: {
        Authorization: token ? `Bearer ${token}` : ''
      },
      debug: () => {},
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        // Subscribe vào topic chat của khóa học
        client.subscribe(`/topic/course/${courseId}/chat`, (message) => {
          try {
            const newMsg: ChatMessage = JSON.parse(message.body);
            setMessages((prev) => {
              // Tránh trùng lặp tin nhắn nếu đã có id
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });

            if (!isOpen) {
              setUnreadCount((prev) => prev + 1);
            }
          } catch (e) {
            console.error('Error parsing STOMP chat message:', e);
          }
        });
      },
      onStompError: (frame) => {
        console.error('STOMP broker reported error: ' + frame.headers['message']);
      }
    });

    client.activate();
    stompClientRef.current = client;

    return () => {
      client.deactivate();
    };
  }, [courseId, isOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || sending) return;

    const text = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      // Gửi qua REST API (sẽ lưu DB và server tự động broadcast qua STOMP)
      const sent = await chatService.sendMessage(courseId, { content: text });
      setMessages((prev) => {
        if (prev.some((m) => m.id === sent.id)) return prev;
        return [...prev, sent];
      });
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể gửi tin nhắn.');
    } finally {
      setSending(false);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    setUnreadCount(0);
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={handleOpen}
          className="relative p-4 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-xl shadow-indigo-600/30 transition-all hover:scale-105 flex items-center justify-center group"
          title="Mở chat nhóm khóa học"
        >
          <MessageCircle className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center shadow-md animate-bounce">
              {unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Chat Window Panel */}
      {isOpen && (
        <div className="w-[360px] sm:w-[400px] h-[520px] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="px-5 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white flex items-center justify-between shadow-sm">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 text-white" />
              </div>
              <div className="truncate">
                <h4 className="text-xs font-bold text-white truncate leading-tight">
                  {courseTitle ? `Phòng Chat: ${courseTitle}` : 'Chat nhóm khóa học'}
                </h4>
                <div className="flex items-center space-x-1.5 text-[10px] text-indigo-100">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Trực tuyến (Real-time STOMP)</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages List Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50 dark:bg-slate-950/40">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <MessageCircle className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-xs">Chưa có tin nhắn nào trong nhóm.</p>
                <p className="text-[11px] text-slate-500">Hãy gửi lời chào đầu tiên đến cả lớp nhé!</p>
              </div>
            ) : (
              messages.map((m) => {
                const isMe = user && m.userId === user.id;

                return (
                  <div
                    key={m.id}
                    className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isMe && (
                      <img
                        src={m.userAvatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.userId}`}
                        alt={m.userFullName}
                        className="w-6 h-6 rounded-full object-cover flex-shrink-0 mb-1"
                      />
                    )}

                    <div className={`max-w-[75%] rounded-2xl p-3 text-xs leading-relaxed ${
                      isMe
                        ? 'bg-indigo-600 text-white rounded-br-none shadow-sm shadow-indigo-600/20'
                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80 rounded-bl-none shadow-xs'
                    }`}>
                      {!isMe && (
                        <div className="flex items-center space-x-1.5 mb-1">
                          <span className="font-bold text-[11px] text-indigo-600 dark:text-indigo-400">
                            {m.userFullName}
                          </span>
                          {m.userRole === 'LECTURER' && (
                            <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                              Giảng viên
                            </span>
                          )}
                        </div>
                      )}

                      <p className="whitespace-pre-wrap">{m.content}</p>

                      <span className={`block text-[9px] mt-1 text-right ${
                        isMe ? 'text-indigo-200' : 'text-slate-400'
                      }`}>
                        {new Date(m.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Bar */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center space-x-2"
          >
            <input
              type="text"
              placeholder="Nhập tin nhắn..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
            <button
              type="submit"
              disabled={sending || !inputText.trim()}
              className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white transition flex items-center justify-center shadow-sm"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
