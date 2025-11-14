import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import responseTime from 'response-time';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable validation pipes globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  app.use(responseTime());
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
