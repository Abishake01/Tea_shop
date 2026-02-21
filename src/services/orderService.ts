import { Storage, StorageKeys } from './storage';
import { Order, OrderItem, CartItem } from '../types';

export const orderService = {
  createOrder: (
    items: CartItem[],
    userId: string,
    tokenNumber?: number
  ): Order => {
    const orders = orderService.getAllOrders();
    
    const orderItems: OrderItem[] = items.map(item => ({
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      tax: item.tax,
      subtotal: item.subtotal,
    }));

    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const tax = items.reduce((sum, item) => {
      const itemSubtotal = item.quantity * item.unitPrice;
      return sum + itemSubtotal * (item.tax / 100);
    }, 0);
    const total = subtotal + tax;

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
    return orders.filter(order => order.tokenNumber === tokenNumber);
  },

  getTokenOrders: (): Order[] => {
    const orders = orderService.getAllOrders();
    return orders.filter(order => order.tokenNumber !== undefined);
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
    const productMap = new Map<string, { productName: string; quantity: number; revenue: number }>();
    
    orders.forEach(order => {
      order.items.forEach(item => {
        const existing = productMap.get(item.productId);
        if (existing) {
          existing.quantity += item.quantity;
          existing.revenue += item.subtotal;
        } else {
          productMap.set(item.productId, {
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

