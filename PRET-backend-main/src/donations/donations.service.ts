import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Donation, DonationDocument } from '../models/donation.schema';
import { User, UserDocument } from '../models/user.schema';
import { CreateDonationDto } from './dto/create-donation.dto';
import { UpdateDonationDto } from './dto/update-donation.dto';

@Injectable()
export class DonationsService {
  constructor(
    @InjectModel('Donation') private donationModel: Model<DonationDocument>,
    @InjectModel('User') private userModel: Model<UserDocument>,
  ) {}

  // CREATE
  async createDonation(userId: string, dto: CreateDonationDto): Promise<Donation> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const donation = new this.donationModel({
      ...dto,
      user: userId,
    });

    return donation.save();
  }

  // READ ALL
  async getDonationsByUser(userId: string): Promise<Donation[]> {
    return this.donationModel
      .find({ user: userId })
      .sort({ createdAt: -1 })
      .exec();
  }

  // READ BY ID
  async getDonationById(donationId: string, userId: string): Promise<Donation> {
    const donation = await this.donationModel.findById(donationId);
    if (!donation) throw new NotFoundException('Donation not found');

    if (donation.user.toString() !== userId) {
      throw new UnauthorizedException('You do not have access to this donation');
    }

    return donation;
  }

  // UPDATE
  async updateDonation(
    donationId: string,
    dto: UpdateDonationDto,
    userId: string,
  ): Promise<Donation> {
    const donation = await this.donationModel.findById(donationId);
    if (!donation) throw new NotFoundException('Donation not found');

    if (donation.user.toString() !== userId) {
      throw new UnauthorizedException('You do not have permission to update this donation');
    }

   Object.entries(dto).forEach(([key, value]) => {
  if (value !== undefined) {
    (donation as any)[key] = value;
  }
});

return donation.save();

  }

  // DELETE
  async deleteDonation(donationId: string, userId: string): Promise<void> {
    const donation = await this.donationModel.findById(donationId);
    if (!donation) throw new NotFoundException('Donation not found');

    if (donation.user.toString() !== userId) {
      throw new UnauthorizedException('You do not have permission to delete this donation');
    }

    await donation.deleteOne();
  }
}
