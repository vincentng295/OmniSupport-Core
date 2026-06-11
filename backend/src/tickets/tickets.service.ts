import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { Ticket } from './ticket.entity';
import { Message, SenderType } from './message.entity';
import { CreateTicketDto } from './dto/create-ticket.dto';

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket)
    private ticketRepository: Repository<Ticket>,
    private dataSource: DataSource, // Dùng để quản lý Transaction
    @InjectQueue('ticket-routing') 
    private ticketQueue: Queue, // Inject hàng đợi Redis
  ) {}

  async create(createTicketDto: CreateTicketDto): Promise<Ticket> {
    const { title, description, priority, messageContent } = createTicketDto;

    // Sử dụng Transaction đảm bảo nếu lỗi lưu message thì ticket cũng không được tạo
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Tạo Ticket
      const ticket = queryRunner.manager.create(Ticket, {
        title,
        description,
        priority,
      });
      const savedTicket = await queryRunner.manager.save(Ticket, ticket);

      // 2. Tạo tin nhắn đầu tiên của khách hàng gắn liền với Ticket này
      const message = queryRunner.manager.create(Message, {
        ticketId: savedTicket.id,
        sender: SenderType.CUSTOMER,
        content: messageContent,
      });
      await queryRunner.manager.save(Message, message);

      await queryRunner.commitTransaction();

      await this.ticketQueue.add('route-ticket', {
        ticketId: savedTicket.id,
      }, { attempts: 3, backoff: 5000 });

      return savedTicket;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(): Promise<Ticket[]> {
    return this.ticketRepository.find({
      relations: {
        messages: true,
      },
      order: { createdAt: 'DESC' },
    });
  }
}