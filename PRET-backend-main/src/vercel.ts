import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { AppModule } from './app.module';

const expressServer = express();
let isInitialized = false;

async function bootstrapNest() {
	const adapter = new ExpressAdapter(expressServer);
	const app = await NestFactory.create(AppModule, adapter);
	await app.init();
	isInitialized = true;
	return expressServer;
}

export default async function handler(req: any, res: any) {
	if (!isInitialized) {
		await bootstrapNest();
	}
	return (expressServer as any)(req, res);
}


