import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Donation,
  DonationDocument,
  DonationStatus,
} from '../models/donation.schema';
import { User, UserDocument, UserRole } from '../models/user.schema';
import { CreateDonationDto } from './dto/create-donation.dto';

@Injectable()
export class DonationsService {
  constructor(
    @InjectModel(Donation.name) private donationModel: Model<DonationDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async createDonation(userId: string, createDonationDto: CreateDonationDto) {
    // Find user by ID
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    // Check if user is a generator
    if (user.role !== UserRole.GENERATOR) {
      throw new BadRequestException('Only generators can create donations');
    }

    // Validate photos count
    if (
      createDonationDto.photos &&
      createDonationDto.photos.length > 3
    ) {
      throw new BadRequestException('Maximum 3 photos allowed');
    }

    // Create donation
    const donation = new this.donationModel({
      donor: userId,
      mealsProvided: createDonationDto.mealsProvided,
      photos: createDonationDto.photos || [],
      pickupLocation: createDonationDto.pickupLocation,
      status: DonationStatus.PENDING,
      notes: createDonationDto.notes,
    });

    const savedDonation = await donation.save();
    return savedDonation;
  }

  async getDonationsByUser(userId: string) {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const donations = await this.donationModel
      .find({ donor: userId })
      .populate('charity', 'name email phone')
      .sort({ createdAt: -1 })
      .exec();

    return donations;
  }

  async getDonationById(donationId: string, userId: string) {
    const donation = await this.donationModel
      .findById(donationId)
      .populate('donor', 'name email phone')
      .populate('charity', 'name email phone')
      .exec();

    if (!donation) {
      throw new NotFoundException('Donation not found');
    }

    // Check if user has access to this donation
    const user = await this.userModel.findById(userId);
    if (
      user.role !== UserRole.ADMIN &&
      donation.donor.toString() !== userId &&
      donation.charity?.toString() !== userId
    ) {
      throw new UnauthorizedException(
        'You do not have access to this donation',
      );
    }

    return donation;
  }
}

