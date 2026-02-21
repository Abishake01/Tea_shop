import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Order } from '../types';
import { orderService } from './orderService';

type ReportType = 'billing' | 'token';

type SalesReport = {
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  topProducts: Array<{
    productId: string;
    productName: string;
    quantity: number;
    revenue: number;
  }>;
  dateRange: {
    start: number;
    end: number;
  };
};

const toCsvValue = (value: string | number | undefined): string => {
  const raw = value === undefined ? '' : String(value);
  const escaped = raw.replace(/"/g, '""');
  return `"${escaped}"`;
};

const filterOrdersByType = (orders: Order[], type: ReportType): Order[] => {
  if (type === 'token') {
    return orders.filter(order => order.tokenNumber !== undefined);
  }
  return orders.filter(order => order.tokenNumber === undefined);
};

const buildSalesReport = (orders: Order[], startDate: number, endDate: number): SalesReport => {
  const filtered = orders.filter(
    order => order.timestamp >= startDate && order.timestamp <= endDate
  );

  const totalSales = filtered.reduce((sum, order) => sum + order.total, 0);
  const totalOrders = filtered.length;
  const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

  const productMap = new Map<string, { productId: string; productName: string; quantity: number; revenue: number }>();

  filtered.forEach(order => {
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
    dateRange: { start: startDate, end: endDate },
  };
};

export const reportService = {
  getReport: (type: ReportType, startDate: number, endDate: number): SalesReport => {
    const orders = orderService.getAllOrders();
    const filtered = filterOrdersByType(orders, type);
    return buildSalesReport(filtered, startDate, endDate);
  },

  exportCsv: async (type: ReportType, startDate: number, endDate: number): Promise<string> => {
    const orders = filterOrdersByType(orderService.getAllOrders(), type)
      .filter(order => order.timestamp >= startDate && order.timestamp <= endDate);

    const header = [
      'orderId',
      'tokenNumber',
      'timestamp',
      'subtotal',
      'tax',
      'total',
      'itemsCount',
      'userId',
    ];

    const rows = orders.map(order => [
      toCsvValue(order.id),
      toCsvValue(order.tokenNumber),
      toCsvValue(new Date(order.timestamp).toISOString()),
      toCsvValue(order.subtotal),
      toCsvValue(order.tax),
      toCsvValue(order.total),
      toCsvValue(order.items.length),
      toCsvValue(order.userId),
    ].join(','));

    const csv = [header.join(','), ...rows].join('\n');
    const fileName = `${type}-report-${Date.now()}.csv`;
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(fileUri, csv, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/csv',
        dialogTitle: `${type.toUpperCase()} Report CSV`,
      });
    }

    return fileUri;
  },
};
