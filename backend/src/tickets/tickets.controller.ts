import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { Ticket } from './ticket.entity';

@ApiTags('Tickets')
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo một ticket mới và đưa vào hàng đợi điều phối' })
  @ApiResponse({ status: 21, description: 'Tạo ticket thành công.', type: Ticket })
  async create(@Body() createTicketDto: CreateTicketDto) {
    return this.ticketsService.create(createTicketDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy toàn bộ danh sách Ticket kèm lịch sử tin nhắn' })
  @ApiResponse({ status: 200, description: 'Thành công.', type: [Ticket] })
  async findAll() {
    return this.ticketsService.findAll();
  }
}