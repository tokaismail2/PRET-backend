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
import { Types } from 'mongoose';
import { Charity, CharityDocument } from '../models/charity.schema';
@Injectable()
export class DonationsService {
  constructor(
    @InjectModel(Donation.name) private donationModel: Model<DonationDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Charity.name) private charityModel: Model<CharityDocument>,
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
      createDonationDto.images &&
      createDonationDto.images.length > 5
    ) {
      throw new BadRequestException('Maximum 5 photos allowed');
    }

    // Create donation
    const donation = new this.donationModel({
      generator: userId,
      mealsProvided: createDonationDto.mealsProvided,
      images: createDonationDto.images || [],
      status: DonationStatus.PENDING,
      notes: createDonationDto.notes,
    });

    const savedDonation = await donation.save();
    return savedDonation;
  }

  async getDonationsByUser(userId: string, page: number, limit: number) {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const donations = await this.donationModel
      .find({ generator: userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    return donations;
  }


  async getDonationById(donationId: string, userId: string) {
    userId = userId.toString();
  
    const donation = await this.donationModel
      .findById(donationId)
      .populate('generator', 'name email phone')
      .exec();
  
    if (!donation) {
      throw new NotFoundException('Donation not found');
    }
  
    // Extract IDs safely
    const generatorId =
      donation.generator instanceof Types.ObjectId
        ? donation.generator.toString()
        : (donation.generator as any)?._id?.toString();

    const user = await this.userModel.findById(userId);
  
    // Allow access if: Admin OR donor
    if (
      user.role !== UserRole.ADMIN &&
      generatorId !== userId 
    ) {
      throw new UnauthorizedException(
        'You do not have access to this donation',
      );
    }
  
    return donation;
  }

  async assignDonation(donationId: string, charityId: string) {
    const donation = await this.donationModel.findById(donationId);
    if (!donation) {
      throw new NotFoundException('Donation not found');
    }
    const charity = await this.charityModel.findById(charityId);
    if (!charity) {
      throw new NotFoundException('Charity not found');
    }
    //convert to object id
    donation.charity = new Types.ObjectId(charityId);
    donation.status = DonationStatus.ACCEPTED;
    await donation.save();
    return donation;
  }
  
  //paginate all donations for admin
  async getAllDonations(page: number, limit: number) {
    const donations = await this.donationModel
      .find()
      .populate('generator', 'name email phone')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();
    return donations;
  }

  async getDonationCount() {
    return this.donationModel.countDocuments().lean();
  }
  
}

