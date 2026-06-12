import { Processor, Process } from '@nestjs/bull';
import type { Job } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket, TicketStatus } from './ticket.entity';
import { AiService } from '../ai/ai.service';

@Processor('ticket-routing') // Trùng tên với Queue đã đăng ký ở Bước 3
export class TicketProcessor {
  constructor(
    @InjectRepository(Ticket)
    private ticketRepository: Repository<Ticket>,
    private aiService: AiService, // Inject AI Service vừa làm ở trên
  ) {}

  @Process('route-ticket') // Trùng tên với job name đã add trong Service
  async handleTicketRouting(job: Job<{ ticketId: string }>) {
    const { ticketId } = job.data;
    console.log(`📦 [Queue] Đang xử lý Ticket ID: ${ticketId}`);

    // 1. Tìm thông tin chi tiết ticket kèm message đầu tiên để lấy ngữ cảnh
    const ticket = await this.ticketRepository.findOne({
      where: { id: ticketId },
      relations: { messages: true },
    });

    if (!ticket) {
      console.warn(`⚠️ Ticket ${ticketId} không tồn tại trong hệ thống.`);
      return;
    }

    const firstMessage = ticket.messages?.[0]?.content || '';

    // 2. Gọi AI phân loại tự động
    console.log(`🤖 Đang gửi dữ liệu sang Gemini AI để phân tích...`);
    const aiTag = await this.aiService.classifyTicket(ticket.title, firstMessage);
    console.log(`🏷️ AI trả về Tag: ${aiTag}`);

    // 3. Cập nhật kết quả vào DB và chuyển trạng thái sang IN_PROGRESS
    ticket.aiTag = aiTag;
    ticket.status = TicketStatus.IN_PROGRESS;
    
    // Giả lập hệ thống auto-routing tự động gán cho một Agent (Ví dụ Agent_Vinh_01)
    ticket.assignedAgentId = 'Agent_Vinh_01';

    await this.ticketRepository.save(ticket);
    console.log(`✅ [Queue] Xử lý hoàn tất Ticket ${ticketId}. Đã cập nhật trạng thái và gán Agent.`);
  }
}