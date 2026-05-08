// cancel-order.job.ts
import { Agenda } from 'agenda';
import { Model } from 'mongoose';
import { OrderDocument, OrderStatus } from '../../models/order.schema';
import { emitNotification } from '../utils/notifications.system';

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

    //emit to socket
    emitNotification(`orderStatus.${order.generatorId}`, {
      orderId: order._id.toString(),
      orderStatus: order.status,
    })
    if (!order) return;
    // optional: logs / notifications
    console.log(`Order ${orderId} auto-cancelled`);
  });
};