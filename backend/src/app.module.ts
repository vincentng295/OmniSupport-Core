import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketsModule } from './tickets/tickets.module';
import { Ticket } from './tickets/ticket.entity';
import { Message } from './tickets/message.entity';

@Module({
  imports: [
    // 1. Đọc file .env ở thư mục gốc ngoài cùng
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../.env',
    }),
    
    // 2. Cấu hình TypeORM kết nối PostgreSQL
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USER'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        entities: [Ticket, Message],
        synchronize: true, // Chỉ dùng khi DEV, TypeORM sẽ tự tạo/sửa bảng dựa trên Entity
      }),
    }),
    
    TicketsModule,
  ],
})
export class AppModule {}