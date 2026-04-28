import { Module, OnModuleInit } from '@nestjs/common';
import { InjectModel, MongooseModule } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Agenda } from 'agenda';
import { Auction, AuctionSchema, AuctionDocument } from '../../models/auction.schema';
import { defineAuctionJobs } from '../../models/auction.schema';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Auction.name, schema: AuctionSchema }]),
    ],
})
export class AgendaModule implements OnModuleInit {
    private agenda: Agenda;

    constructor(
        @InjectModel(Auction.name)
        private readonly auctionModel: Model<AuctionDocument>,
    ) { }

    async onModuleInit() {
        this.agenda = new Agenda({
            mongo: process.env.MONGO_URI,   
            db: undefined,                  
            collection: 'agendaJobs',
        } as any);

        defineAuctionJobs(this.agenda, this.auctionModel);

        await this.agenda.start();
        console.log('[Agenda] Scheduler started.');
    }

    async onModuleDestroy() {
        await this.agenda.stop();
    }
}