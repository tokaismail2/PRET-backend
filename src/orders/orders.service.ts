import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument, OrderStatus } from '../models/order.schema';
import { User, UserDocument, UserRole } from '../models/user.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { UserWallet, UserWalletDocument } from '../models/userWallet.schema';
import { WalletTransaction, WalletTransactionDocument } from '../models/walletTransactions.schema';
import { WarehouseReceipt, WarehouseReceiptDocument } from '../models/warehouseReceipt.schema';
import { Warehouse, WarehouseDocument } from '../models/warehouse.schema';
import { Generator, GeneratorDocument } from '../models/generator.schema';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Material, MaterialDocument } from '../models/material.schema';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(UserWallet.name) private userWalletModel: Model<UserWalletDocument>,
    @InjectModel(WalletTransaction.name) private walletTransactionModel: Model<WalletTransactionDocument>,
    @InjectModel(WarehouseReceipt.name) private warehouseReceiptModel: Model<WarehouseReceiptDocument>,
    @InjectModel(Warehouse.name) private warehouseModel: Model<WarehouseDocument>,
    @InjectModel(Generator.name) private generatorModel: Model<GeneratorDocument>,
    @InjectModel(Material.name) private materialModel: Model<MaterialDocument>,
  ) { }


  async createOrder(userId: string, createOrderDto: CreateOrderDto) {
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
      throw new BadRequestException('Only generators can create orders');
    }

    // Calculate total price
    const totalPrice = createOrderDto.quantity * createOrderDto.price;

    // Create order
    const order = new this.orderModel({
      generatorId: userId,
      materialTypeId: new Types.ObjectId(createOrderDto.materialType),
      quantity: createOrderDto.quantity,
      unit: createOrderDto.unit,
      price: createOrderDto.price,
      totalPrice: totalPrice,
      status: OrderStatus.PENDING,
      photos: createOrderDto.photos || [],
      notes: createOrderDto.notes
    });

    const savedOrder = await order.save();
    return savedOrder;
  }

  async getAllOrders(filters: {
    status?: string;
    generatorId?: string;
    driverId?: string;
    factoryId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    // Initialize an empty query object
    const query: any = {};

    // Filter by status
    if (filters.status) {
      query.status = filters.status;
    }

    // Filter by generator
    if (filters.generatorId) {
      query.generatorId = filters.generatorId;
    }

    // Filter by driver
    if (filters.driverId) {
      query.driverId = filters.driverId;
    }

    // Filter by factory
    if (filters.factoryId) {
      query.factoryId = filters.factoryId;
    }

    // Filter by date range
    if (filters.startDate || filters.endDate) {
      query.createdAt = {};

      if (filters.startDate) {
        query.createdAt.$gte = new Date(filters.startDate);
      }

      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999);
        query.createdAt.$lte = endDate;
      }
    }

    const orders = await this.orderModel
      .find(query)
      .populate('generatorId', 'name email phone')
      .populate('materialTypeId', 'name price')

      .sort({ createdAt: -1 })
      .lean();

    // Enrich orders with generator address
    const ordersWithAddress = await Promise.all(
      orders.map(async (order) => {
        // Get generator details including address
        let generator = null;
        if (order.generatorId && (order.generatorId as any)._id) {
          generator = await this.generatorModel
            .findOne({ user: (order.generatorId as any)._id })
            .select('businessName generatorType address')
            .lean();
        }

        return {
          ...order,
          generator: generator || null,
        };
      })
    );

    return ordersWithAddress;


  }

  async getMyOrdersHistory(userId: string, status?: string) {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    let filter: any = {};

    if (user.role === UserRole.GENERATOR) {
      filter.generatorId = userId;
    }
    else if (user.role === UserRole.DRIVER) {
      filter.driverId = userId;
    }
    else {
      throw new ForbiddenException('Invalid role');
    }

    // add status only if it exists
    if (status) {
      filter.status = status;
    }

    const orders = await this.orderModel
      .find(filter)
      .populate('materialTypeId')
      .sort({ createdAt: -1 })
      .exec();

    return orders;
  }

  async getOrderById(orderId: string, userId: string) {
    userId = userId.toString(); // important

    const order = await this.orderModel
      .findById(orderId)
      .populate('generatorId', 'name email phone')
      .populate('materialTypeId', 'name price')
      .lean();

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Get generator details including address
    let generator = null;
    if (order.generatorId && (order.generatorId as any)._id) {
      generator = await this.generatorModel
        .findOne({ user: (order.generatorId as any)._id })
        .select('businessName generatorType address')
        .lean();
    }

    const orderWithAddress = {
      ...order,
      generator: generator || null,
    };


    return orderWithAddress;
  }

  async updateOrderById(orderId: string, updateDto: UpdateOrderDto) {

    const order = await this.orderModel.findOne({
      _id: orderId,
      status: OrderStatus.PENDING,
    });

    if (!order) {
      throw new ConflictException(
        'Order not found or cannot be updated (status is not PENDING)',
      );
    }

    // Build update object safely
    const updateData: any = {};

    if (updateDto.quantity !== undefined) {
      updateData.quantity = updateDto.quantity;
      updateData.totalPrice = updateDto.quantity * order.price;
    }

    if (updateDto.notes !== undefined) {
      updateData.notes = updateDto.notes;
    }

    //can update on photo 
    if (updateDto.photos !== undefined) {
      updateData.photos = updateDto.photos;
    }

    if (updateDto.materialType !== undefined) {
      updateData.materialTypeId = updateDto.materialType;
      const materialType = await this.materialModel.findById(updateDto.materialType);
      if (!materialType) {
        throw new NotFoundException('Material type not found');
      }
      updateData.price = materialType.price;
      updateData.totalPrice = updateData.quantity * materialType.price;
    }

    const updatedOrder = await this.orderModel.findByIdAndUpdate(
      orderId,
      { $set: updateData },
      { new: true },
    );

    return updatedOrder;
  }

  async deleteOrder(orderId: string, userId: string) {
    const order = await this.orderModel.findById(orderId);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check if user is the generator who created the order
    if (order.generatorId.toString() !== userId.toString()) {
      throw new UnauthorizedException('You do not have permission to delete this order');
    }

    // Check if order is in a state that can be deleted
    if (order.status !== OrderStatus.PENDING) {
      throw new ConflictException('Order cannot be deleted as it is not in PENDING status');
    }

    // Delete the order
    await this.orderModel.findByIdAndDelete(orderId);

    return { message: 'Order deleted successfully' };
  }


  async assignDriver(orderId: string, driverUserId: string, orderCode: string) {

    const order = await this.orderModel.findById(orderId);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new ConflictException(`Order cannot be assigned status is ${order.status}`);
    }

    if (order.driverId) {
      throw new ConflictException('Driver already assigned');
    }

    if (orderCode.toString() !== order.orderCode.toString()) {
      throw new ConflictException('Order code is incorrect');
    }

    order.driverId = new Types.ObjectId(driverUserId);
    order.status = OrderStatus.IN_TRANSIT;

    await order.save();

    //add the totalPrice for order to wallet of generator
    const generator = await this.userModel.findById(order.generatorId);
    if (!generator) {
      throw new NotFoundException('Generator not found');
    }
    const wallet = await this.userWalletModel.findOne({ userId: generator._id });

    wallet.balance += order.totalPrice;
    await wallet.save();

    //create wallet Transaction
    const walletTransaction = new this.walletTransactionModel({
      walletId: wallet._id,
      type: 'deposit',
      amount: order.totalPrice,
      description: `Deposit for order ${order._id}`,
    });
    await walletTransaction.save();

    return {
      order: order
    };
  }

  async arriveToWarehouse(
    orderId: string,
    warehouseId: string,
    driverUserId: string
  ) {

    const order = await this.orderModel.findById(orderId);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== OrderStatus.IN_TRANSIT) {
      throw new ConflictException(
        `Order cannot be completed, status is ${order.status}`
      );
    }

    if (order.driverId.toString() !== driverUserId.toString()) {
      throw new ConflictException('Driver is not assigned to this order');
    }

    const existingReceipt = await this.warehouseReceiptModel.findOne({
      order_id: order._id,
    });

    if (existingReceipt) {
      throw new ConflictException('Warehouse receipt already created');
    }

    const warehouseReceipt = await this.warehouseReceiptModel.create({
      warehouse_id: new Types.ObjectId(warehouseId),
      order_id: order._id,
      driver_id: new Types.ObjectId(driverUserId),
      received_weight: order.quantity,
      price_per_kg: order.price,
      total_amount: order.totalPrice,
    });

    order.status = OrderStatus.COMPLETED;
    order.warehouseId = new Types.ObjectId(warehouseId);
    await order.save();


    //Driver wallet logic
    const deliveryFee = order.totalPrice * 0.1;
    const driverWallet = await this.userWalletModel.findOne({ userId: driverUserId });

    driverWallet.balance += deliveryFee;
    await driverWallet.save();

    const walletTransaction = await this.walletTransactionModel.create({
      walletId: driverWallet._id,
      type: 'withdrawal',
      amount: deliveryFee,
      description: `trip_fee for order ${order._id}`,
    });
    await walletTransaction.save();

    return {
      order,
      warehouseReceipt,
    };
  }







}

