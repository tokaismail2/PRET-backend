import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import express from 'express';
import { AppModule } from '../src/app.module';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

const server = express();
let isInitialized = false;

export default async function handler(req: any, res: any) {
	if (!isInitialized) {
		const adapter = new ExpressAdapter(server);
		const app = await NestFactory.create(AppModule, adapter);

		const configService = app.get(ConfigService);

		// Mirror configurations from src/main.ts
		app.enableCors({
			origin: true,
			credentials: true,
		});

		app.useGlobalPipes(
			new ValidationPipe({
				whitelist: true,
				forbidNonWhitelisted: true,
				transform: true,
				transformOptions: {
					enableImplicitConversion: true,
				},
				disableErrorMessages: configService.get('NODE_ENV') === 'production',
			}),
		);

		app.useGlobalInterceptors(new TransformInterceptor());
		app.useGlobalFilters(new HttpExceptionFilter());

		await app.init();
		isInitialized = true;
	}
	return (server as any)(req, res);
}

