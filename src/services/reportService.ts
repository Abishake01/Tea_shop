import * as FileSystem from 'expo-file-system/legacy';
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
    return orders.filter(
      order =>
        order.tokenNumber !== undefined ||
        order.items.some(item => item.tokenNumber !== undefined)
    );
  }
  return orders.filter(
    order =>
      order.tokenNumber === undefined &&
      !order.items.some(item => item.tokenNumber !== undefined)
  );
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
    try {
      const dir = FileSystem.documentDirectory;
      if (!dir) {
        throw new Error('File system is not available. Try again or use a different device.');
      }

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
    const fileUri = `${dir}${fileName}`;

    await FileSystem.writeAsStringAsync(fileUri, csv, {
      encoding: 'utf8',
    });

      const sharingAvailable = await Sharing.isAvailableAsync();
      if (sharingAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: `${type.toUpperCase()} Report CSV`,
        });
      } else {
        throw new Error('Sharing is not available on this device. File was saved locally.');
      }

      return fileUri;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      throw new Error(message);
    }
  },
};
