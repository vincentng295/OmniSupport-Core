import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Bật Validation gầm định (để class-validator hoạt động)
  app.useGlobalPipes(new ValidationPipe());

  // --- CẤU HÌNH SWAGGER ---
  const config = new DocumentBuilder()
    .setTitle('OmniSupport Core API')
    .setDescription('Tài liệu API hệ thống điều phối ticket & chat real-time')
    .setVersion('1.0')
    .addBearerAuth() // Nếu sau này có làm bảo mật JWT
    .build();
    
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document); // Đường dẫn trang test: localhost:3000/api/docs
  // ------------------------

  // Đọc port từ file .env (mặc định là 3000 nếu chưa nhận)
  const port = process.env.APP_PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Server đang chạy tại: http://localhost:${port}`);
  console.log(`📑 Trang test API (Swagger): http://localhost:${port}/api/docs`);
}
bootstrap();