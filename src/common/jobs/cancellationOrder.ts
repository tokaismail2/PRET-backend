// cancel-order.job.ts
import { Agenda } from 'agenda';
import { Model } from 'mongoose';
import { OrderDocument, OrderStatus } from '../../models/order.schema';
import { emitNotification, sendDeviceNotification } from '../utils/notifications.system';
import { UserDocument } from '../../models/user.schema';
export const defineOrderJobs = (
  agenda: Agenda,
  userModel: Model<UserDocument>,
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

    const generator = await userModel.findById(order.generatorId)

    //emit to device
    sendDeviceNotification(generator.device_token, 'Order changed', JSON.stringify({
      orderId: order._id.toString(),
      orderStatus: order.status,
    }));
    if (!order) return;
    // optional: logs / notifications
    console.log(`Order ${orderId} auto-cancelled`);
  });
};