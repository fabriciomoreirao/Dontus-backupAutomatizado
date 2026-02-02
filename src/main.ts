import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { EnvironmentValidator } from './infra/config/env';
import * as gracefulShutdown from 'http-graceful-shutdown';
import helmet from 'helmet';
import { RateLimitGuard } from './common/middleware/rate-limit.guard';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  EnvironmentValidator.validate();

  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.enableCors();

  app.useGlobalGuards(new RateLimitGuard());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Remove propriedades não decoradas
      forbidNonWhitelisted: true, // Rejeita requisições com propriedades não permitidas
      transform: true, // Transforma automaticamente os tipos
      transformOptions: {
        enableImplicitConversion: true, // Transforma automaticamente os tipos
      },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('S3 API')
    .setDescription('API do sistema S3')
    .setVersion('1.0')
    .addApiKey(
      {
        type: 'apiKey',
        name: 's3-api-key',
        in: 'header',
        description: 'API Key para autenticação',
      },
      's3-api-key',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  gracefulShutdown(app.getHttpServer());

  logger.log(`🚀 Aplicação iniciada com sucesso!`);
}

bootstrap();
