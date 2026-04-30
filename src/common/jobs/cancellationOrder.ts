// cancel-order.job.ts
import { Agenda } from 'agenda';
import { Model } from 'mongoose';
import { OrderDocument, OrderStatus } from '../../models/order.schema';

export const defineOrderJobs = (
  agenda: Agenda,
  orderModel: Model<OrderDocument>,
) => {
  agenda.define('cancel-order-if-not-received', async (job) => {
    const { orderId } = job.attrs.data;

    const order = await orderModel.findOneAndUpdate(
      {
        _id: orderId,
        status: OrderStatus.AWAITING_PICKUP_CONFIRMATION,
      },
      {
        status: OrderStatus.CANCELLED,
      },
      { new: true }
    );

    if (!order) return;

    // optional: logs / notifications
    console.log(`Order ${orderId} auto-cancelled`);
  });
};