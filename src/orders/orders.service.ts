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
      buyer: userId,
      materialTypeId: createOrderDto.materialType,
      quantity: createOrderDto.quantity,
      unit: createOrderDto.unit,
      price: createOrderDto.price,
      totalPrice: totalPrice,
      status: OrderStatus.PENDING,
      photos: createOrderDto.photos || [],
      notes: createOrderDto.notes,
    });

    const savedOrder = await order.save();
    return savedOrder;
  }

  async getAllOrders(filters: {
    status?: string;
    buyerId?: string;
    driverId?: string;
    sellerId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    // Initialize an empty query object
    const query: any = {};

    // Filter by status
    if (filters.status) {
      query.status = filters.status;
    }

    // Filter by buyer
    if (filters.buyerId) {
      query.buyer = filters.buyerId;
    }

    // Filter by driver
    if (filters.driverId) {
      query.driver = filters.driverId;
    }

    // Filter by seller
    if (filters.sellerId) {
      query.seller = filters.sellerId;
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


    // Fetch orders based on constructed query
    // fetch address of buyer
    const orders = await this.orderModel
      .find(query)
      .sort({ createdAt: -1 })
      .lean();

    // Enrich orders with generator address
    const ordersWithAddress = await Promise.all(
      orders.map(async (order) => {
        // Get generator details including address
        let generator = null;
        if (order.buyer && (order.buyer as any)._id) {
          generator = await this.generatorModel
            .findOne({ user: (order.buyer as any)._id })
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


  async getOrdersByUser(userId: string, status?: OrderStatus) {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const query: any = { buyer: userId };
    if (status) {
      query.status = status;
    }

    const orders = await this.orderModel
      .find(query)
      .populate('seller', 'name email phone')
      .sort({ createdAt: -1 })
      .exec();

    return orders;

  }

  async getOrderById(orderId: string, userId: string) {
    userId = userId.toString(); // important

    const order = await this.orderModel
      .findById(orderId)
      .populate('buyer', 'name email phone')
      .populate('seller', 'name email phone')
      .populate('driverId', 'name email phone')
      .lean();

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const user = await this.userModel.findById(userId);

    const buyerId = (order.buyer as any)?._id?.toString();
    const sellerId = (order.seller as any)?._id?.toString();

    if (
      user.role !== UserRole.ADMIN &&
      buyerId !== userId &&
      sellerId !== userId
    ) {
      throw new UnauthorizedException('You do not have access to this order');
    }

    return order;
  }

  async assignDriver(orderId: string, driverUserId: string) {

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

    order.driverId = new Types.ObjectId(driverUserId);
    order.status = OrderStatus.IN_TRANSIT;

    await order.save();

    //add the totalPrice for order to wallet of generator
    const generator = await this.userModel.findById(order.buyer);
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

