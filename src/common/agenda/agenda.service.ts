import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import Agenda from 'agenda';
import { Order, OrderDocument } from '../../models/order.schema';
import { defineOrderJobs } from '../jobs/cancellationOrder';
import { defineAuctionJobs } from '../jobs/auctionClosed';
import { ConfigService } from '@nestjs/config';
import { User, UserDocument } from '../../models/user.schema';
import { Auction, AuctionDocument } from '../../models/auction.schema';
import { AuctionBid, AuctionBidDocument } from '../../models/auctionBids.schema';
import { Waste, WasteDocument } from '../../models/waste.schema';
import { UserWallet, UserWalletDocument } from '../../models/userWallet.schema';
import { WalletTransaction, WalletTransactionDocument } from '../../models/walletTransactions.schema';

@Injectable()
export class AgendaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AgendaService.name);
  private agenda!: Agenda;

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    @InjectModel(Auction.name) private readonly auctionModel: Model<AuctionDocument>,
    @InjectModel(AuctionBid.name) private readonly auctionBidModel: Model<AuctionBidDocument>,
    @InjectModel(Waste.name) private readonly wasteModel: Model<WasteDocument>,
    @InjectModel(UserWallet.name) private readonly userWalletModel: Model<UserWalletDocument>,
    @InjectModel(WalletTransaction.name) private readonly walletTransactionModel: Model<WalletTransactionDocument>,
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

    // Register order cancellation jobs
    defineOrderJobs(this.agenda, this.userModel, this.orderModel);

    // Register auction auto-close jobs
    defineAuctionJobs(
      this.agenda,
      this.auctionModel,
      this.auctionBidModel,
      this.wasteModel,
      this.userModel,
      this.userWalletModel,
      this.walletTransactionModel,
    );

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