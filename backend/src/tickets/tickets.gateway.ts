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
    private messageRepository: Repository<Message>,
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

    // Lưu tin nhắn mới vào Database PostgreSQL
    const newMessage = this.messageRepository.create({
      ticketId,
      sender,
      content,
    });
    const savedMessage = await this.messageRepository.save(newMessage);

    // Bắn tin nhắn này tới TẤT CẢ mọi người đang ở trong phòng ticketId này
    this.server.to(ticketId).emit('receiveMessage', savedMessage);
    console.log(`💬 [Room ${ticketId}] ${sender}: ${content}`);
  }
}