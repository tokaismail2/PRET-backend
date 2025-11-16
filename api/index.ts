import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { AppModule } from '../src/app.module';

const server = express();
let isInitialized = false;

export default async function handler(req: any, res: any) {
	if (!isInitialized) {
		const adapter = new ExpressAdapter(server);
		const app = await NestFactory.create(AppModule, adapter);
		await app.init();
		isInitialized = true;
	}
	return (server as any)(req, res);
}

