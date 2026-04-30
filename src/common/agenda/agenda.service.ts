import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import Agenda from 'agenda';
import { Order, OrderDocument } from '../../models/order.schema';
import { defineOrderJobs } from '../jobs/cancellationOrder';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AgendaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AgendaService.name);
  private agenda!: Agenda;

  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    private readonly configService: ConfigService,
  ) { }

  async onModuleInit() {
    const mongoUri = this.configService.get<string>('MONGO_URI');

    if (!mongoUri) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }

    // v4 stable API — manages its own connection, no driver conflicts
    this.agenda = new Agenda({
      db: {
        address: mongoUri,
        collection: 'agendaJobs',
      },
      processEvery: '30 seconds',
      maxConcurrency: 20,
    });

    // Wait for Agenda to be ready before defining jobs
    await new Promise<void>((resolve, reject) => {
      this.agenda.once('ready', resolve);
      this.agenda.once('error', reject);
    });

    defineOrderJobs(this.agenda, this.orderModel);

    await this.agenda.start();
    this.logger.log('Agenda scheduler started');
  }

  async onModuleDestroy() {
    if (this.agenda) {
      await this.agenda.stop();
      this.logger.log('Agenda scheduler stopped');
    }
  }

  getAgenda(): Agenda {
    return this.agenda;
  }
}