import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

// Định nghĩa cấu trúc tin nhắn tương thích với Backend
interface Message {
  id?: string;
  ticketId: string;
  sender: 'CUSTOMER' | 'AGENT' | 'AI';
  content: string;
  createdAt?: string;
}

export default function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // State quản lý form kết nối phòng chat
  const [ticketId, setTicketId] = useState('f2b2cdb8-0467-42ce-b727-1a7606b472f5'); // Dán UUID ticket của bạn vào đây
  const [joinedRoom, setJoinedRoom] = useState<string | null>(null);
  const [role, setRole] = useState<'CUSTOMER' | 'AGENT'>('AGENT'); // Vai trò khi test
  
  // State quản lý tin nhắn
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Khởi tạo kết nối Socket.io Gateway khi ứng dụng bật lên
  useEffect(() => {
    const socketInstance = io('http://localhost:3000', {
      transports: ['websocket'],
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
      console.log('🔌 Đã kết nối WebSocket thành công với ID:', socketInstance.id);
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
      setJoinedRoom(null);
    });

    // Lắng nghe tin nhắn real-time được đồng bộ từ phòng chat của backend
    socketInstance.on('receiveMessage', (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  // Tự động cuộn xuống tin nhắn mới nhất khi có chat mới
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 2. Hàm tham gia vào phòng Ticket chat
  const joinTicketRoom = () => {
    if (!socket || !ticketId.trim()) return;
    
    // Phát sự kiện 'joinTicket' lên NestJS Gateway
    socket.emit('joinTicket', { ticketId });
    setJoinedRoom(ticketId);
    setMessages([]); // Xóa lịch sử tạm thời trên UI để đón nhận luồng chat mới
    console.log(`👥 Đã gửi yêu cầu join vào phòng: ${ticketId}`);
  };

  // 3. Hàm gửi tin nhắn qua Socket
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket || !inputMessage.trim() || !joinedRoom) return;

    const messageData: Message = {
      ticketId: joinedRoom,
      sender: role,
      content: inputMessage.trim(),
    };

    // Phát sự kiện 'sendMessage' lên NestJS Gateway để ghi DB và broadcast
    socket.emit('sendMessage', messageData);
    setInputMessage('');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-950 font-sans">
      {/* Header trạng thái */}
      <div className="w-full max-w-4xl mb-4 flex justify-between items-center bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg">
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            OmniSupport Real-time Test Center 🤖
          </h1>
          <p className="text-xs text-slate-400 mt-1">Dự án hệ thống phân phối điều phối Ticket</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`h-3 w-3 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
          <span className="text-sm font-medium text-slate-300">
            {isConnected ? 'Gateway Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-4 h-[600px]">
        {/* Sidebar điều khiển cấu hình test */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">Cấu hình Phòng Test</h2>
            
            {/* Input điền Ticket ID */}
            <div>
              <label className="block text-xs text-slate-400 mb-1 font-medium">Ticket UUID từ DB</label>
              <input
                type="text"
                disabled={!!joinedRoom}
                value={ticketId}
                onChange={(e) => setTicketId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-mono text-cyan-400 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
                placeholder="Nhập Ticket ID từ lệnh cURL..."
              />
            </div>

            {/* Toggle Vai trò */}
            <div>
              <label className="block text-xs text-slate-400 mb-2 font-medium">Bạn muốn đóng vai ai để chat?</label>
              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setRole('CUSTOMER')}
                  className={`py-1.5 text-xs font-medium rounded-md transition-all ${role === 'CUSTOMER' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  🙍‍♂️ Khách Hàng
                </button>
                <button
                  type="button"
                  onClick={() => setRole('AGENT')}
                  className={`py-1.5 text-xs font-medium rounded-md transition-all ${role === 'AGENT' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  🎧 Support Agent
                </button>
              </div>
            </div>

            {/* Nút bấm Join Room */}
            {!joinedRoom ? (
              <button
                type="button"
                onClick={joinTicketRoom}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg py-2 text-sm font-medium transition-colors shadow-lg shadow-indigo-900/30"
              >
                Vào Phòng Chat 🚀
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setJoinedRoom(null)}
                className="w-full bg-rose-950/40 hover:bg-rose-900/40 text-rose-400 border border-rose-900 rounded-lg py-2 text-sm font-medium transition-colors"
              >
                Rời Phòng Chat
              </button>
            )}
          </div>

          <div className="text-[11px] text-slate-500 leading-relaxed border-t border-slate-800 pt-4">
            💡 <b className="text-slate-400">Mẹo:</b> Bạn có thể mở đồng thời 2 tab trình duyệt, một tab chọn vai <span className="text-emerald-400 font-bold">Khách Hàng</span>, một tab vai <span className="text-cyan-400 font-bold">Agent</span> để tự chat qua lại và kiểm tra độ trễ real-time!
          </div>
        </div>

        {/* Khung Chat Chính */}
        <div className="md:grid-cols-1 md:col-span-2 bg-slate-900 border border-slate-800 rounded-xl shadow-lg flex flex-col overflow-hidden">
          {joinedRoom ? (
            <>
              {/* Tiêu đề phòng chat hiện tại */}
              <div className="bg-slate-950/60 border-b border-slate-800/80 px-4 py-3 flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-slate-400">Đang ở trong phòng:</div>
                  <div className="text-xs font-mono text-indigo-400 truncate w-64 md:w-96">{joinedRoom}</div>
                </div>
                <span className="text-[10px] bg-slate-800 px-2 py-1 rounded text-slate-400 font-medium font-mono uppercase">
                  Role: {role}
                </span>
              </div>

              {/* Khu vực hiển thị tin nhắn */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-950/40">
                {messages.length === 0 && (
                  <div className="h-full flex items-center justify-center text-slate-500 text-xs italic">
                    Chưa có tin nhắn nào trong luồng real-time này. Hãy bắt đầu gõ chat!
                  </div>
                )}
                {messages.map((msg, index) => {
                  const isMe = msg.sender === role;
                  return (
                    <div key={index} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <span className="text-[10px] text-slate-500 mb-1 px-1 font-semibold">
                        {msg.sender === 'CUSTOMER' ? '🙍‍♂️ CUSTOMER' : msg.sender === 'AGENT' ? '🎧 AGENT' : '🤖 AI ASSISTANT'}
                      </span>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-md whitespace-pre-wrap ${
                        isMe 
                          ? role === 'AGENT' ? 'bg-cyan-600 text-white rounded-tr-none' : 'bg-emerald-600 text-white rounded-tr-none'
                          : msg.sender === 'CUSTOMER' ? 'bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700' : msg.sender === 'AI' ? 'bg-purple-900/60 text-purple-200 border border-purple-800 rounded-tl-none' : 'bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700'
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Form gõ và gửi tin nhắn */}
              <form onSubmit={handleSendMessage} className="p-3 bg-slate-950 border-t border-slate-800 flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder={`Gửi tin nhắn với tư cách là ${role === 'AGENT' ? 'Agent' : 'Khách hàng'}...`}
                />
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 rounded-lg text-sm font-medium transition-colors"
                >
                  Gửi 🕊️
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 text-center space-y-3">
              <div className="text-4xl">🔌</div>
              <p className="text-sm">Vui lòng nhập <b className="text-slate-400">Ticket UUID</b> hợp lệ ở menu bên trái và ấn nút <b className="text-slate-300">"Vào Phòng Chat"</b> để kết nối kênh truyền tải dữ liệu tức thì.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}