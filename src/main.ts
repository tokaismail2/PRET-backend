import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import responseTime from 'response-time';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.use((req, res, next) => {
    req.body = sanitize(req.body);
    next();
  });

  function sanitize(obj: any) {
    if (!obj) return obj;

    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }

    if (typeof obj === 'object') {
      if (obj.$date) return new Date(obj.$date);

      const clean: any = {};
      for (const key in obj) {
        clean[key] = sanitize(obj[key]);
      }
      return clean;
    }

    return obj;
  }


  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      disableErrorMessages: false,
    }),
  );

  // Global interceptors
  app.useGlobalInterceptors(new TransformInterceptor());

  // Global exception filters
  app.useGlobalFilters(new HttpExceptionFilter());

  // Middleware
  app.use(responseTime());

  const port = configService.get<number>('PORT') || 5000;
  const host = configService.get<string>('HOST') || 'localhost';

  await app.listen(port);
  console.log(`Application is running on: http://${host}:${port}`);
}

bootstrap().catch((error) => {
  console.error('Error starting application:', error);
  process.exit(1);
});