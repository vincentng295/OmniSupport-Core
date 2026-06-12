import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';
import { Ticket } from './ticket.entity';
import { Message } from './message.entity';
import { AiModule } from '../ai/ai.module';
import { TicketProcessor } from './ticket.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ticket, Message]),
    BullModule.registerQueue({
      name: 'ticket-routing',
    }),
    AiModule,
  ],
  controllers: [TicketsController],
  providers: [TicketsService, TicketProcessor],
})
export class TicketsModule {}