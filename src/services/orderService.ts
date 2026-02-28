import { Storage, StorageKeys } from './storage';
import { Order, OrderItem, CartItem } from '../types';
import { productService } from './productService';

const tokenCounterKey = (category: string) => {
  const today = new Date().toISOString().slice(0, 10);
  return `tokenCounter_${category.replace(/[^a-zA-Z0-9]/g, '_')}_${today}`;
};

type CreateOrderOptions = { isCompliment?: boolean; paymentMethod?: string };

export const orderService = {
  createOrder: (
    items: CartItem[],
    userId: string,
    tokenNumber?: number,
    options?: CreateOrderOptions
  ): Order => {
    const orders = orderService.getAllOrders();
    const isCompliment = options?.isCompliment ?? false;

    const orderItems: OrderItem[] = items.map(item => ({
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      tax: item.tax,
      subtotal: isCompliment ? 0 : item.subtotal,
    }));

    const subtotal = isCompliment ? 0 : items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const tax = isCompliment ? 0 : items.reduce((sum, item) => {
      const itemSubtotal = item.quantity * item.unitPrice;
      return sum + itemSubtotal * (item.tax / 100);
    }, 0);
    const total = isCompliment ? 0 : subtotal + tax;

    const newOrder: Order = {
      id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      items: orderItems,
      subtotal,
      tax,
      total,
      tokenNumber,
      timestamp: Date.now(),
      userId,
      status: tokenNumber ? 'preparing' : undefined,
      paymentMethod: options?.paymentMethod,
      isCompliment: isCompliment || undefined,
    };

    orders.push(newOrder);
    Storage.setArray(StorageKeys.ORDERS, orders);
    return newOrder;
  },

  getNextTokenNumberForCategory: (category: string): number => {
    const key = tokenCounterKey(category);
    const current = Storage.getNumber(key) || 0;
    const next = current + 1;
    Storage.setNumber(key, next);
    return next;
  },

  peekNextTokenNumberForCategory: (category: string): number => {
    const key = tokenCounterKey(category);
    const current = Storage.getNumber(key) || 0;
    return current + 1;
  },

  createTokenOrder: (items: CartItem[], userId: string, options?: CreateOrderOptions): Order => {
    const orders = orderService.getAllOrders();
    const orderItems: OrderItem[] = [];
    let firstToken: number | undefined;
    const isCompliment = options?.isCompliment ?? false;

    for (const cartItem of items) {
      const product = productService.getProductById(cartItem.productId);
      const category = product?.category ?? 'Other';
      for (let q = 0; q < cartItem.quantity; q++) {
        const tokenNum = orderService.getNextTokenNumberForCategory(category);
        if (firstToken === undefined) firstToken = tokenNum;
        orderItems.push({
          productId: cartItem.productId,
          productName: cartItem.productName,
          quantity: 1,
          unitPrice: cartItem.unitPrice,
          tax: cartItem.tax,
          subtotal: isCompliment ? 0 : cartItem.unitPrice * (1 + cartItem.tax / 100),
          tokenNumber: tokenNum,
          category,
        });
      }
    }

    const subtotal = isCompliment ? 0 : orderItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
    const tax = isCompliment ? 0 : orderItems.reduce((sum, i) => sum + i.unitPrice * i.quantity * (i.tax / 100), 0);
    const total = isCompliment ? 0 : subtotal + tax;

    const newOrder: Order = {
      id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      items: orderItems,
      subtotal,
      tax,
      total,
      tokenNumber: firstToken,
      timestamp: Date.now(),
      userId,
      status: 'preparing',
      paymentMethod: options?.paymentMethod,
      isCompliment: isCompliment || undefined,
    };

    orders.push(newOrder);
    Storage.setArray(StorageKeys.ORDERS, orders);
    return newOrder;
  },

  getAllOrders: (): Order[] => {
    return Storage.getArray<Order>(StorageKeys.ORDERS);
  },

  getOrderById: (id: string): Order | null => {
    const orders = orderService.getAllOrders();
    return orders.find(o => o.id === id) || null;
  },

  getOrdersByDateRange: (startDate: number, endDate: number): Order[] => {
    const orders = orderService.getAllOrders();
    return orders.filter(
      order => order.timestamp >= startDate && order.timestamp <= endDate
    );
  },

  getOrdersByToken: (tokenNumber: number): Order[] => {
    const orders = orderService.getAllOrders();
    return orders.filter(
      order =>
        order.tokenNumber === tokenNumber ||
        order.items.some(item => item.tokenNumber === tokenNumber)
    );
  },

  getTokenOrders: (): Order[] => {
    const orders = orderService.getAllOrders();
    return orders.filter(
      order =>
        order.tokenNumber !== undefined ||
        order.items.some(item => item.tokenNumber !== undefined)
    );
  },

  getBillingOrders: (): Order[] => {
    const orders = orderService.getAllOrders();
    return orders.filter(
      order =>
        order.tokenNumber === undefined &&
        !order.items.some(item => item.tokenNumber !== undefined)
    );
  },

  updateOrderStatus: (id: string, status: 'preparing' | 'ready' | 'completed'): Order | null => {
    const orders = orderService.getAllOrders();
    const index = orders.findIndex(o => o.id === id);
    if (index === -1) return null;

    orders[index] = { ...orders[index], status };
    Storage.setArray(StorageKeys.ORDERS, orders);
    return orders[index];
  },

  getNextTokenNumber: (): number => {
    const currentCounter = Storage.getNumber(StorageKeys.TOKEN_COUNTER) || 0;
    const nextToken = currentCounter + 1;
    Storage.setNumber(StorageKeys.TOKEN_COUNTER, nextToken);
    return nextToken;
  },

  peekNextTokenNumber: (): number => {
    const currentCounter = Storage.getNumber(StorageKeys.TOKEN_COUNTER) || 0;
    return currentCounter + 1;
  },

  getSalesReport: (startDate: number, endDate: number) => {
    const orders = orderService.getOrdersByDateRange(startDate, endDate);
    
    const totalSales = orders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    // Calculate top products
    const productMap = new Map<string, { productId: string; productName: string; quantity: number; revenue: number }>();
    
    orders.forEach(order => {
      order.items.forEach(item => {
        const existing = productMap.get(item.productId);
        if (existing) {
          existing.quantity += item.quantity;
          existing.revenue += item.subtotal;
        } else {
          productMap.set(item.productId, {
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            revenue: item.subtotal,
          });
        }
      });
    });

    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    return {
      totalSales,
      totalOrders,
      averageOrderValue,
      topProducts,
      dateRange: {
        start: startDate,
        end: endDate,
      },
    };
  },
};

