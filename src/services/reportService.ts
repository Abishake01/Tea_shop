import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Order, OrderItem } from '../types';
import { orderService } from './orderService';
import { productService } from './productService';

export type ReportType = 'all' | 'billing' | 'token';

type SalesReportProduct = {
  productId: string;
  productName: string;
  quantity: number;
  revenue: number;
  category?: string;
};

const toCsvValue = (value: string | number | undefined): string => {
  const raw = value === undefined ? '' : String(value);
  const escaped = raw.replace(/"/g, '""');
  return `"${escaped}"`;
};

const getItemCategory = (item: OrderItem): string => {
  if (item.category) return item.category;
  const product = productService.getProductById(item.productId);
  return product?.category ?? 'Other';
};

const filterOrdersByType = (orders: Order[], type: ReportType): Order[] => {
  if (type === 'all') return orders;
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

const buildSalesReport = (
  orders: Order[],
  startDate: number,
  endDate: number,
  type: ReportType
): import('../types').SalesReport => {
  const filtered = orders.filter(
    order => order.timestamp >= startDate && order.timestamp <= endDate
  );

  const totalSales = filtered.reduce((sum, order) => sum + order.total, 0);
  const totalOrders = filtered.length;
  const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

  const productMap = new Map<string, SalesReportProduct>();

  filtered.forEach(order => {
    order.items.forEach(item => {
      const category = getItemCategory(item);
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
          category,
        });
      }
    });
  });

  const allProducts = Array.from(productMap.values())
    .sort((a, b) => b.revenue - a.revenue);
  const topProducts = allProducts.slice(0, 10);

  const productsByCategory: Record<string, { items: SalesReportProduct[]; totalQty: number; totalRevenue: number }> = {};
  allProducts.forEach(p => {
    const cat = p.category ?? 'Other';
    if (!productsByCategory[cat]) {
      productsByCategory[cat] = { items: [], totalQty: 0, totalRevenue: 0 };
    }
    productsByCategory[cat].items.push(p);
    productsByCategory[cat].totalQty += p.quantity;
    productsByCategory[cat].totalRevenue += p.revenue;
  });

  let tokenByNumber: Record<number, { items: SalesReportProduct[]; orderId: string; total: number }> | undefined;
  if (type === 'token') {
    tokenByNumber = {};
    filtered.forEach(order => {
      const byToken = new Map<number, OrderItem[]>();
      order.items.forEach(item => {
        const tn = item.tokenNumber ?? order.tokenNumber;
        if (tn != null) {
          const list = byToken.get(tn) ?? [];
          list.push(item);
          byToken.set(tn, list);
        }
      });
      byToken.forEach((tokenItems, tn) => {
        const prodMap = new Map<string, SalesReportProduct>();
        tokenItems.forEach(item => {
          const existing = prodMap.get(item.productId);
          const cat = getItemCategory(item);
          if (existing) {
            existing.quantity += item.quantity;
            existing.revenue += item.subtotal;
          } else {
            prodMap.set(item.productId, {
              productId: item.productId,
              productName: item.productName,
              quantity: item.quantity,
              revenue: item.subtotal,
              category: cat,
            });
          }
        });
        const items = Array.from(prodMap.values());
        const total = items.reduce((s, i) => s + i.revenue, 0);
        tokenByNumber[tn] = { items, orderId: order.id, total };
      });
    });
  }

  return {
    totalSales,
    totalOrders,
    averageOrderValue,
    topProducts,
    allProducts,
    productsByCategory,
    tokenByNumber,
    dateRange: { start: startDate, end: endDate },
  };
};

export const reportService = {
  getReport: (type: ReportType, startDate: number, endDate: number): import('../types').SalesReport => {
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
