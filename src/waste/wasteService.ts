// waste.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Waste, WasteDocument } from '../models/waste.schema';
import { CreateWasteDto } from './dto/create';
import { UpdateWasteDto } from './dto/update';
import { User, UserDocument } from '../models/user.schema';
import { UserWallet, UserWalletDocument } from '../models/userWallet.schema';
import { WalletTransaction, WalletTransactionDocument } from '../models/walletTransactions.schema';
import { Types } from 'mongoose';

@Injectable()
export class WasteService {
  constructor(
    @InjectModel(Waste.name)
    private wasteModel: Model<WasteDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(UserWallet.name) private userWalletModel: Model<UserWalletDocument>,
    @InjectModel(WalletTransaction.name) private walletTransactionModel: Model<WalletTransactionDocument>,
  ) { }

  // استلام الويست من الوير هاوس 
  async create(createWasteDto: CreateWasteDto): Promise<any> {
    const waste = new this.wasteModel({
      ...createWasteDto,
      warehouse_id: new Types.ObjectId(createWasteDto.warehouse_id),
      material_id: new Types.ObjectId(createWasteDto.material_id),
    });

    await waste.save();

    // minus price from admin wallet (driver take the action)
    const admin = await this.userModel.findOne({ role: 'admin' });
    if (!admin) throw new NotFoundException('Admin not found');

    const wallet = await this.userWalletModel.findOne({ userId: admin._id });
    if (!wallet) throw new NotFoundException('Wallet not found');
    wallet.balance -= createWasteDto.price;
    await wallet.save();

    //create wallet transaction 
    const walletTransaction = new this.walletTransactionModel({
      walletId: wallet._id,
      type: 'withdrawal',
      userId: admin._id,
      amount: createWasteDto.price,
      description: `Withdrawal for waste ${waste._id}`,
    });
    await walletTransaction.save();
    return waste;
  }

  // READ ALL
  async findAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.wasteModel
        .find()
        .populate('warehouse_id', 'name contract_number')
        .populate('material_id', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),

      this.wasteModel.countDocuments(),
    ]);

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // READ ONE
  async findOne(id: string): Promise<Waste> {
    const waste = await this.wasteModel.findById(id)
      .populate('warehouse_id', 'name contract_number')
      .populate('material_id', 'name')
      .lean();
    if (!waste) throw new NotFoundException('Waste not found');
    return waste;
  }

  // UPDATE
  async update(
    id: string,
    updateWasteDto: UpdateWasteDto,
  ): Promise<Waste> {
    const updatedWaste = await this.wasteModel.findByIdAndUpdate(
      id,
      updateWasteDto,
      { new: true },
    );

    if (!updatedWaste) throw new NotFoundException('Waste not found');
    return updatedWaste;
  }

  // DELETE
  async remove(id: string): Promise<{ message: string }> {
    const deletedWaste = await this.wasteModel.findByIdAndDelete(id);
    if (!deletedWaste) throw new NotFoundException('Waste not found');
    return { message: 'Waste deleted successfully' };
  }

}
