import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class AiService {
  private ai: GoogleGenerativeAI;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
        throw new Error('❌ CRITICAL ERROR: GEMINI_API_KEY is not defined in .env file!');
    }
    // Khởi tạo instance bằng class chuẩn của Google SDK
    this.ai = new GoogleGenerativeAI(apiKey); 
  }

  async classifyTicket(title: string, content: string): Promise<string> {
    try {
      // Gọi model gemini-1.5-flash
      const model = this.ai.getGenerativeModel({ model: 'gemma-4-26b-a4b-it' });
      
      const prompt = `
        You are an advanced Customer Support AI. Analyze the following customer ticket:
        Title: "${title}"
        Content: "${content}"

        Classify this ticket into exactly ONE of these categories: [Bug, Billing, Inquiry].
        Return ONLY the category name as a single word. Do not include any punctuation, markdown, or explanation.
      `;

      // Cú pháp generate nội dung text đơn giản, ngắn gọn
      const result = await model.generateContent(prompt);
      const responseText = result.response.text().trim();
      
      const validCategories = ['Bug', 'Billing', 'Inquiry'];
      return validCategories.includes(responseText) ? responseText : 'Inquiry';
    } catch (error) {
      console.error('❌ AI Classification Error:', error);
      return 'Inquiry';
    }
  }

  async generateAutoReply(ticketTitle: string, customerContent: string): Promise<string> {
    try {
      const model = this.ai.getGenerativeModel({ 
        model: 'gemma-4-26b-a4b-it' 
      });
      
      const prompt = `
        You are an elite, empathetic Omnichannel Customer Support AI named "OmniAssistant". 
        The customer opened a ticket titled: "${ticketTitle}".
        They said: "${customerContent}"

        Provide a short, helpful, and professional response in Vietnamese (under 3 sentences). 
        Acknowledge their issue, tell them an agent is being routed, and give a brief comforting closing.
        Do not include any placeholders, markdown, or metadata in your response.
      `;

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          // Tắt tính năng show thought output của dòng Gemini 3
          thinkingConfig: {
            thinkingBudget: 0, 
          },
        } as any
      });

      return result.response.text().trim();
    } catch (error) {
      console.error('❌ AI Auto-Reply Error:', error);
      return 'Cảm ơn bạn đã liên hệ. Hệ thống đang điều phối nhân viên hỗ trợ bạn ngay trong giây lát!';
    }
  }
}