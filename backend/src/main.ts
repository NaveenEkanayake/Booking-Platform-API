import { join } from 'path';

// Load environment variables before importing AppModule
try {
  if (typeof process.loadEnvFile === 'function') {
    process.loadEnvFile(join(__dirname, '../../.env'));
  }
} catch (error) {
  try {
    if (typeof process.loadEnvFile === 'function') {
      process.loadEnvFile(join(process.cwd(), '../.env'));
    }
  } catch (err) {
    try {
      if (typeof process.loadEnvFile === 'function') {
        process.loadEnvFile(join(process.cwd(), '.env'));
      }
    } catch (e) {}
  }
}

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.useGlobalFilters(new HttpExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: 'http://localhost:5173', // Vite Frontend default port
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('Booking Platform API')
    .setDescription('Self-contained Booking Platform REST API')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT access token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 Backend running on http://localhost:${port}`);
  console.log(`📚 Swagger Docs at http://localhost:${port}/api/docs`);
}
bootstrap();
