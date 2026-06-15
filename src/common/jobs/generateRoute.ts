import { Agenda } from 'agenda';
import { Model, Types } from 'mongoose';
import { OrderDocument } from '../../models/order.schema';
import { RouteDocument } from '../../models/route.schema';

export const GENERATE_ROUTES_JOB = 'generate-pending-routes';

const MAX_WEIGHT = 200;
const MAX_DISTANCE = 30; // km

export const defineGenerateRoutesJob = (
  agenda: Agenda,
  orderModel: Model<OrderDocument>,
  routeModel: Model<RouteDocument>,
) => {
  agenda.define(GENERATE_ROUTES_JOB, { concurrency: 1 }, async (job) => {
    try {
      const { orderId } = job.attrs.data || {};

      if (!orderId) throw new Error('orderId is required');

      const orderObjectId =
        orderId instanceof Types.ObjectId
          ? orderId
          : new Types.ObjectId(String(orderId));

      // ── 1. Fetch the new order ─────────────────────────────────────────
      const order = await orderModel.findById(orderObjectId).lean();

      if (!order) throw new Error(`Order ${orderObjectId} not found`);

      if (
        order.status !== 'pending' ||
        order.lat == null ||
        order.lng == null
      ) {
        console.log(
          `[${GENERATE_ROUTES_JOB}] Order ${orderObjectId} skipped — status=${order.status} lat=${order.lat} lng=${order.lng}`,
        );
        return;
      }

      // ── 2. Fetch all unassigned routes (no driver yet) ─────────────────
      const allRoutes = await routeModel
        .find({ driver: { $exists: false } })
        .lean();

      // ── 3. Duplicate check ─────────────────────────────────────────────
      const alreadyAssigned = allRoutes.some((r) =>
        r.orderIds.some(
          (x) => x.id?.toString() === orderObjectId.toString(),
        ),
      );

      if (alreadyAssigned) {
        console.log(
          `[${GENERATE_ROUTES_JOB}] Order ${orderObjectId} already assigned — skipping`,
        );
        return;
      }

      // ── 4. Batch-fetch all orders referenced by all routes ─────────────
      const allRouteOrderIds = allRoutes.flatMap((r) =>
        r.orderIds.map((x) => new Types.ObjectId(x.id.toString())),
      );

      const allRouteOrdersMap = new Map<string, OrderDocument>();

      if (allRouteOrderIds.length > 0) {
        const fetched = await orderModel
          .find({ _id: { $in: allRouteOrderIds }, status: 'pending' })
          .lean();

        for (const o of fetched) {
          allRouteOrdersMap.set(o._id.toString(), o as OrderDocument);
        }
      }

      // ── 5. Find best-fit route ─────────────────────────────────────────
      //
      // Criteria (in order):
      //   a) Adding this order must NOT exceed MAX_WEIGHT
      //   b) Every existing order in the route must be within MAX_DISTANCE
      //      of the new order (so the driver doesn't travel too far)
      //   c) Among valid routes, prefer the one whose orders are
      //      geographically CLOSEST to the new order (minimise avg distance)
      //      — this keeps routes tight and avoids sprawl.
      //
      let bestRoute: (typeof allRoutes)[0] | null = null;
      let bestAvgDistance = Infinity;

      for (const route of allRoutes) {
        // 5a. Resolve the actual order documents for this route
        const routeOrders = route.orderIds
          .map((x) => allRouteOrdersMap.get(x.id?.toString()))
          .filter((o): o is OrderDocument => o != null);

        // 5b. Weight check
        const currentWeight = routeOrders.reduce(
          (sum, o) => sum + (o.quantity || 0),
          0,
        );

        if (currentWeight + (order.quantity || 0) > MAX_WEIGHT) continue;

        // 5c. Distance check — every existing order must be within
        //     MAX_DISTANCE km of the new order
        const ordersWithCoords = routeOrders.filter(
          (o) => o.lat != null && o.lng != null,
        );

        const allWithinDistance = ordersWithCoords.every(
          (o) =>
            haversineDistance(o.lat!, o.lng!, order.lat!, order.lng!) <=
            MAX_DISTANCE,
        );

        if (!allWithinDistance) continue;

        // 5d. Also check the route's startPoint against the new order
        if (route.startPoint?.latitude != null && route.startPoint?.longitude != null) {
          const startDist = haversineDistance(
            route.startPoint.latitude,
            route.startPoint.longitude,
            order.lat!,
            order.lng!,
          );
          if (startDist > MAX_DISTANCE) continue;
        }

        // 5e. Score: average distance of all existing orders from new order
        //     (lower = better, keeps the route geographically tight)
        const avgDistance =
          ordersWithCoords.length > 0
            ? ordersWithCoords.reduce(
                (sum, o) =>
                  sum +
                  haversineDistance(o.lat!, o.lng!, order.lat!, order.lng!),
                0,
              ) / ordersWithCoords.length
            : 0; // empty route → distance 0, always valid

        if (avgDistance < bestAvgDistance) {
          bestAvgDistance = avgDistance;
          bestRoute = route;
        }
      }

      // ── 6. Add to best route ───────────────────────────────────────────
      if (bestRoute) {
        const updated = await routeModel.findByIdAndUpdate(
          bestRoute._id,
          {
            $push: {
              orderIds: { id: orderObjectId, status: 'pending' },
            },
          },
          { new: true, runValidators: false },
        );

        if (!updated) {
          throw new Error(
            `Route ${bestRoute._id} disappeared during update`,
          );
        }

        const savedOrder = updated.orderIds.find(
          (x) => x.id?.toString() === orderObjectId.toString(),
        );

        if (!savedOrder) {
          throw new Error(
            `Order ${orderObjectId} push to route ${bestRoute._id} silently failed`,
          );
        }

        console.log(
          `[${GENERATE_ROUTES_JOB}] Order ${orderObjectId} → existing route ${updated._id} (avgDist=${bestAvgDistance.toFixed(1)}km) ✓`,
        );
        return;
      }

      // ── 7. No valid route — create a new one ──────────────────────────
      //
      // startPoint = the new order's own coordinates.
      // As more orders are added to this route later, the startPoint
      // stays fixed (it was set when the route was first created).
      //
      const newRoute = await routeModel.create({
        orderIds: [{ id: orderObjectId, status: 'pending' }],
        startPoint: { latitude: order.lat, longitude: order.lng },
      });

      console.log(
        `[${GENERATE_ROUTES_JOB}] New route ${newRoute._id} created for order ${orderObjectId}`,
      );
    } catch (error) {
      console.error(
        `[${GENERATE_ROUTES_JOB}] Failed: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  });
};

// ── Haversine formula ──────────────────────────────────────────────────────
const haversineDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number => {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};