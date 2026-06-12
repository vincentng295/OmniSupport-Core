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
      const model = this.ai.getGenerativeModel({ model: 'gemini-3.0-flash' });
      
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
}