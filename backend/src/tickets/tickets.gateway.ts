import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message, SenderType } from './message.entity';
import { Ticket } from './ticket.entity';
import { AiService } from 'src/ai/ai.service';

@WebSocketGateway({
  cors: {
    origin: '*', // Cho phép mọi nguồn kết nối (thuận tiện khi làm Frontend sau này)
  },
})
export class TicketsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,

    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>, // <-- Đảm bảo có dòng này

    private readonly aiService: AiService, // <-- Đảm bảo có dòng này
  ) {}

  handleConnection(client: Socket) {
    console.log(`🔌 Client kết nối Socket: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`❌ Client ngắt kết nối Socket: ${client.id}`);
  }

  // 1. Sự kiện khi Khách/Agent nhấn vào ticket để mở phòng chat
  @SubscribeMessage('joinTicket')
  handleJoinTicket(
    @MessageBody() data: { ticketId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(data.ticketId);
    console.log(`👥 Client ${client.id} đã tham gia vào phòng Ticket: ${data.ticketId}`);
  }

  // 2. Sự kiện gửi tin nhắn chat qua lại
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() data: { ticketId: string; sender: SenderType; content: string },
  ) {
    const { ticketId, sender, content } = data;

    // 1. Lưu tin nhắn của Người (Customer hoặc Agent) vào DB
    const newMessage = this.messageRepository.create({ ticketId, sender, content });
    const savedMessage = await this.messageRepository.save(newMessage);

    // Phát tín hiệu cho cả phòng nhận tin nhắn của Người vừa gõ
    this.server.to(ticketId).emit('receiveMessage', savedMessage);
    console.log(`💬 [Room ${ticketId}] ${sender}: ${content}`);

    // 2. NẾU NGƯỜI GỬI LÀ CUSTOMER -> KÍCH HOẠT AI TRẢ LỜI TỰ ĐỘNG REAL-TIME
    if (sender === SenderType.CUSTOMER) {
      console.log(`🤖 Phát hiện Customer nhắn tin. Đang gọi Gemini AI phản hồi...`);
      
      try {
        // Lấy thông tin ticket để AI biết ngữ cảnh (Context tiêu đề)
        const ticket = await this.ticketRepository.findOne({ where: { id: ticketId } });
        const ticketTitle = ticket ? ticket.title : 'Hỗ trợ khách hàng';

        // Gọi hàm tạo tin nhắn trả lời tự động bằng tiếng Việt từ Gemini 3.0 Flash
        const aiReplyContent = await this.aiService.generateAutoReply(ticketTitle, content);

        // Lưu tin nhắn của AI vào Database
        const aiMessage = this.messageRepository.create({
          ticketId,
          sender: SenderType.AI, // Sender là AI
          content: aiReplyContent,
        });
        const savedAiMessage = await this.messageRepository.save(aiMessage);

        // Bắn tin nhắn của AI qua WebSocket về phòng chat lập tức
        this.server.to(ticketId).emit('receiveMessage', savedAiMessage);
        console.log(`🤖 [Room ${ticketId}] AI ASSISTANT: ${aiReplyContent}`);
      } catch (error) {
        console.error('❌ Lỗi xử lý AI phản hồi real-time:', error);
      }
    }
  }
}