
import { connectToDatabase } from '@/lib/mongodb';
import type { Order, OrderDoc, OrderItem, ShippingAddress, User, OrderStatus, Product } from '@/types';
import { ObjectId } from 'mongodb';

interface CreateOrderData {
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  shippingAddress: ShippingAddress;
  paymentMethod: string;
  orderStatus: Order['orderStatus'];
  appliedCouponCode?: string;
  couponDiscountAmount?: number;
}

/**
 * Creates a new order in the database.
 */
export async function createOrder(orderData: CreateOrderData): Promise<Order | null> {
  const { 
    userId, items, totalAmount, shippingAddress, paymentMethod, orderStatus, 
    appliedCouponCode, couponDiscountAmount 
  } = orderData;

  console.log(`[orderService] createOrder called for userId: ${userId}`);
  try {
    const { db } = await connectToDatabase();
    const ordersCollection = db.collection<OrderDoc>('orders');

    const newOrderDocument: Omit<OrderDoc, '_id'> = {
      userId,
      items, 
      totalAmount,
      shippingAddress,
      paymentMethod,
      orderStatus,
      appliedCouponCode: appliedCouponCode || undefined,
      couponDiscountAmount: couponDiscountAmount || undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await ordersCollection.insertOne(newOrderDocument as OrderDoc);
    if (!result.insertedId) {
      console.error('[orderService] Failed to insert order into database.');
      throw new Error('Failed to create order in database.');
    }

    const createdOrder: Order = {
      _id: result.insertedId.toString(),
      id: result.insertedId.toString(),
      userId: newOrderDocument.userId,
      items: newOrderDocument.items,
      totalAmount: newOrderDocument.totalAmount,
      shippingAddress: newOrderDocument.shippingAddress,
      paymentMethod: newOrderDocument.paymentMethod,
      orderStatus: newOrderDocument.orderStatus,
      appliedCouponCode: newOrderDocument.appliedCouponCode,
      couponDiscountAmount: newOrderDocument.couponDiscountAmount,
      createdAt: newOrderDocument.createdAt.toISOString(),
      updatedAt: newOrderDocument.updatedAt.toISOString(),
    };
    
    console.log('[orderService] Order created successfully:', createdOrder.id);
    return createdOrder;

  } catch (error: any) {
    console.error(`[orderService] Error in createOrder for userId "${userId}":`, error.message);
    throw error;
  }
}


/**
 * Fetches all orders for the admin panel.
 */
export async function getAdminOrders(): Promise<Order[]> {
  console.log('[orderService] getAdminOrders called');
  try {
    const { db } = await connectToDatabase();
    const ordersCollection = db.collection<OrderDoc>('orders');
    
    const ordersArray = await ordersCollection.find({}).sort({ createdAt: -1 }).toArray();
    
    const populatedOrders = ordersArray.map(order => ({
      ...order,
      _id: order._id.toString(),
      id: order._id.toString(),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      deliveredAt: order.deliveredAt ? order.deliveredAt.toISOString() : undefined,
      appliedCouponCode: order.appliedCouponCode || undefined,
      couponDiscountAmount: order.couponDiscountAmount || undefined,
      items: order.items.map(item => ({ 
        ...item,
      })),
    })) as Order[];

    console.log(`[orderService] Fetched ${populatedOrders.length} orders for admin.`);
    return populatedOrders;
  } catch (error: any) {
    console.error('[orderService] Error in getAdminOrders:', error.message);
    return [];
  }
}

/**
 * Fetches all orders for a specific user.
 */
export async function getOrdersByUserId(userId: string): Promise<Order[]> {
  console.log(`[orderService] getOrdersByUserId called for userId: ${userId}`);
  if (!ObjectId.isValid(userId)) {
      console.warn(`[orderService] Invalid userId format: ${userId}`);
      return [];
  }

  try {
    const { db } = await connectToDatabase();
    const ordersCollection = db.collection<OrderDoc>('orders');
    
    const ordersArray = await ordersCollection.find({ userId: userId }).sort({ createdAt: -1 }).toArray();
    
    const userOrders = ordersArray.map(order => ({
      ...order,
      _id: order._id.toString(),
      id: order._id.toString(),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      deliveredAt: order.deliveredAt ? order.deliveredAt.toISOString() : undefined,
      appliedCouponCode: order.appliedCouponCode || undefined,
      couponDiscountAmount: order.couponDiscountAmount || undefined,
      items: order.items.map(item => ({
        ...item,
      })),
    })) as Order[];

    console.log(`[orderService] Fetched ${userOrders.length} orders for userId: ${userId}.`);
    return userOrders;
  } catch (error: any) {
    console.error(`[orderService] Error in getOrdersByUserId for ${userId}:`, error.message);
    return [];
  }
}

/**
 * Fetches a single order by its ID for a specific user.
 */
export async function getUserOrderById(orderId: string, userId: string): Promise<Order | null> {
  console.log(`[orderService] getUserOrderById called for orderId: ${orderId}, userId: ${userId}`);
  if (!ObjectId.isValid(orderId) || !ObjectId.isValid(userId)) {
    console.warn(`[orderService] Invalid orderId or userId format.`);
    throw new Error('Invalid ID format.');
  }

  try {
    const { db } = await connectToDatabase();
    const ordersCollection = db.collection<OrderDoc>('orders');
    
    const orderDoc = await ordersCollection.findOne({ _id: new ObjectId(orderId), userId: userId });
    
    if (!orderDoc) {
      console.warn(`[orderService] Order ${orderId} not found for user ${userId}.`);
      return null;
    }

    const order = {
      ...orderDoc,
      _id: orderDoc._id.toString(),
      id: orderDoc._id.toString(),
      createdAt: orderDoc.createdAt.toISOString(),
      updatedAt: orderDoc.updatedAt.toISOString(),
      deliveredAt: orderDoc.deliveredAt ? orderDoc.deliveredAt.toISOString() : undefined,
      appliedCouponCode: orderDoc.appliedCouponCode || undefined,
      couponDiscountAmount: orderDoc.couponDiscountAmount || undefined,
      items: orderDoc.items.map(item => ({
        ...item,
      })),
    } as Order;
    
    console.log(`[orderService] Fetched order ${order.id} for user ${userId}.`);
    return order;
  } catch (error: any) {
    console.error(`[orderService] Error in getUserOrderById for order ${orderId}, user ${userId}:`, error.message);
    throw error;
  }
}


/**
 * Cancels an order for a specific user if it's in a cancellable state.
 */
export async function cancelUserOrder(orderId: string, userId: string): Promise<Order | null> {
  console.log(`[orderService] cancelUserOrder called for orderId: ${orderId}, userId: ${userId}`);
  if (!ObjectId.isValid(orderId) || !ObjectId.isValid(userId)) {
    console.warn(`[orderService] Invalid orderId or userId format.`);
    throw new Error('Invalid ID format.');
  }

  try {
    const { db } = await connectToDatabase();
    const ordersCollection = db.collection<OrderDoc>('orders');

    const order = await ordersCollection.findOne({ _id: new ObjectId(orderId), userId: userId });

    if (!order) {
      console.warn(`[orderService] Order ${orderId} not found for user ${userId}.`);
      return null; 
    }

    if (order.orderStatus !== "Pending" && order.orderStatus !== "Processing") {
      console.warn(`[orderService] Order ${orderId} cannot be cancelled. Status: ${order.orderStatus}`);
      throw new Error(`Order cannot be cancelled as it is already ${order.orderStatus}.`);
    }

    const result = await ordersCollection.findOneAndUpdate(
      { _id: new ObjectId(orderId), userId: userId },
      { $set: { orderStatus: "Cancelled", updatedAt: new Date() } },
      { returnDocument: 'after' }
    );
    
    if (!result) {
        console.warn(`[orderService] Order ${orderId} not found during update for user ${userId} or update failed.`);
        return null;
    }

    const updatedOrderDoc = result as OrderDoc;

    console.log(`[orderService] Order ${orderId} cancelled successfully for user ${userId}.`);
    return {
      ...updatedOrderDoc,
      _id: updatedOrderDoc._id.toString(),
      id: updatedOrderDoc._id.toString(),
      createdAt: updatedOrderDoc.createdAt.toISOString(),
      updatedAt: updatedOrderDoc.updatedAt.toISOString(),
      deliveredAt: updatedOrderDoc.deliveredAt ? updatedOrderDoc.deliveredAt.toISOString() : undefined,
      appliedCouponCode: updatedOrderDoc.appliedCouponCode || undefined,
      couponDiscountAmount: updatedOrderDoc.couponDiscountAmount || undefined,
      items: updatedOrderDoc.items.map(item => ({
        ...item,
      })),
    } as Order;

  } catch (error: any) {
    console.error(`[orderService] Error cancelling order ${orderId} for user ${userId}:`, error.message);
    throw error; 
  }
}

/**
 * Updates the status of an order (Admin action).
 * Sets deliveredAt if status is 'Delivered'.
 * Decrements product stock if status is 'Delivered'.
 */
export async function updateOrderStatus(orderId: string, newStatus: OrderStatus): Promise<Order | null> {
  console.log(`[orderService] updateOrderStatus called for orderId: ${orderId}, newStatus: ${newStatus}`);
  if (!ObjectId.isValid(orderId)) {
    console.warn(`[orderService] Invalid orderId format for status update: ${orderId}`);
    throw new Error('Invalid order ID format.');
  }

  const validStatuses: OrderStatus[] = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled", "Failed"];
  if (!validStatuses.includes(newStatus)) {
    console.warn(`[orderService] Invalid newStatus: ${newStatus}`);
    throw new Error('Invalid order status provided.');
  }

  try {
    const { db } = await connectToDatabase();
    const ordersCollection = db.collection<OrderDoc>('orders');
    const productsCollection = db.collection<Product>('products');

    const updatePayload: Partial<OrderDoc> & { updatedAt: Date } = {
      orderStatus: newStatus,
      updatedAt: new Date(),
    };

    if (newStatus === 'Delivered') {
      updatePayload.deliveredAt = new Date();
    }

    const result = await ordersCollection.findOneAndUpdate(
      { _id: new ObjectId(orderId) },
      { $set: updatePayload },
      { returnDocument: 'after' }
    );

    if (!result) {
      console.warn(`[orderService] Order not found for status update with ID: ${orderId}`);
      return null;
    }
    
    const updatedOrderDoc = result as OrderDoc;
    console.log(`[orderService] Order ${orderId} status updated to ${newStatus}.`);

    if (newStatus === 'Delivered' && updatedOrderDoc.items) {
      console.log(`[orderService] Order ${orderId} marked as Delivered. Updating stock for ${updatedOrderDoc.items.length} items.`);
      for (const item of updatedOrderDoc.items) {
        if (!item.productId || !ObjectId.isValid(item.productId)) {
          console.warn(`[orderService] Invalid productId ${item.productId} for item ${item.name} in order ${orderId}. Skipping stock update for this item.`);
          continue;
        }
        try {
          const productUpdateResult = await productsCollection.updateOne(
            { _id: new ObjectId(item.productId) },
            { $inc: { stock: -item.quantity } }
          );
          if (productUpdateResult.matchedCount === 0) {
            console.warn(`[orderService] Product with ID ${item.productId} not found for stock update (Order: ${orderId}, Item: ${item.name}).`);
          } else if (productUpdateResult.modifiedCount === 0) {
            console.warn(`[orderService] Stock for product ID ${item.productId} was not modified (Order: ${orderId}, Item: ${item.name}). This might be okay if stock was already low or an issue if not expected.`);
          } else {
            console.log(`[orderService] Stock for product ${item.name} (ID: ${item.productId}) decremented by ${item.quantity}.`);
          }
        } catch (stockError: any) {
          console.error(`[orderService] Error updating stock for product ID ${item.productId} (Order: ${orderId}, Item: ${item.name}):`, stockError.message);
        }
      }
    }

    return {
      ...updatedOrderDoc,
      _id: updatedOrderDoc._id.toString(),
      id: updatedOrderDoc._id.toString(),
      createdAt: updatedOrderDoc.createdAt.toISOString(),
      updatedAt: updatedOrderDoc.updatedAt.toISOString(),
      deliveredAt: updatedOrderDoc.deliveredAt ? updatedOrderDoc.deliveredAt.toISOString() : undefined,
      appliedCouponCode: updatedOrderDoc.appliedCouponCode || undefined,
      couponDiscountAmount: updatedOrderDoc.couponDiscountAmount || undefined,
      items: updatedOrderDoc.items.map(item => ({
        ...item,
      })),
    } as Order;

  } catch (error: any) {
    console.error(`[orderService] Error updating order status for ${orderId}:`, error.message);
    throw error;
  }
}


/**
 * Fetches a single order by its ID for Admin.
 */
export async function getAdminOrderById(orderId: string): Promise<Order | null> {
  console.log(`[orderService] getAdminOrderById called for orderId: ${orderId}`);
  if (!ObjectId.isValid(orderId)) {
    console.warn(`[orderService] Invalid orderId format.`);
    throw new Error('Invalid ID format.');
  }

  try {
    const { db } = await connectToDatabase();
    const ordersCollection = db.collection<OrderDoc>('orders');
    
    const orderDoc = await ordersCollection.findOne({ _id: new ObjectId(orderId) });
    
    if (!orderDoc) {
      console.warn(`[orderService] Admin: Order ${orderId} not found.`);
      return null;
    }

    const order = {
      ...orderDoc,
      _id: orderDoc._id.toString(),
      id: orderDoc._id.toString(),
      createdAt: orderDoc.createdAt.toISOString(),
      updatedAt: orderDoc.updatedAt.toISOString(),
      deliveredAt: orderDoc.deliveredAt ? orderDoc.deliveredAt.toISOString() : undefined,
      appliedCouponCode: orderDoc.appliedCouponCode || undefined,
      couponDiscountAmount: orderDoc.couponDiscountAmount || undefined,
      items: orderDoc.items.map(item => ({
        ...item,
      })),
    } as Order;
    
    console.log(`[orderService] Admin: Fetched order ${order.id}.`);
    return order;
  } catch (error: any) {
    console.error(`[orderService] Admin: Error in getOrderById for order ${orderId}:`, error.message);
    throw error;
  }
}

    