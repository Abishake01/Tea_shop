export interface User {
  id: string;
  username: string;
  password: string; // hashed
  name: string;
  role: 'admin' | 'staff';
  createdAt: number;
}

export interface Product {
  id: string;
  name: string;
  imageUri?: string;
  price: number;
  category: string;
  sku: string;
  tax: number; // percentage
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  tax: number;
  subtotal: number;
}

export interface Order {
  id: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  tokenNumber?: number;
  timestamp: number;
  userId: string;
  status?: 'preparing' | 'ready' | 'completed';
}

export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  tax: number;
  subtotal: number;
}

export interface SalesReport {
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
}

export interface Settings {
  currency: string;
  defaultTaxRate: number;
  shopName: string;
  autoPrintAfterCheckout: boolean;
  tokenPrintMode: 'single' | 'multi';
}

