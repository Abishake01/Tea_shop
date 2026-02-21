import Constants from 'expo-constants';
import { Order } from '../types';
import { settingsService } from './settingsService';
import { Storage, StorageKeys } from './storage';
import { formatCurrency } from '../utils/formatters';

type PrintResult = {
  success: boolean;
  message?: string;
};

type PrinterDevice = {
  name: string;
  address: string;
};

const isExpoGo = Constants.appOwnership === 'expo';

const line = '--------------------------------';

const formatMoney = (amount: number, currency: string): string => {
  try {
    return formatCurrency(amount, currency);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
};

const formatOrderText = (order: Order, shopName: string, currency: string): string => {
  const lines: string[] = [];

  lines.push(`${shopName}\n`);
  lines.push(`${line}\n`);
  lines.push(`Order: ${order.id}\n`);
  if (order.tokenNumber !== undefined) {
    lines.push(`Token: #${order.tokenNumber}\n`);
  }
  lines.push(`Date: ${new Date(order.timestamp).toLocaleString()}\n`);
  lines.push(`${line}\n`);

  order.items.forEach(item => {
    const itemLine = `${item.productName} x${item.quantity}`;
    const amountLine = `${formatMoney(item.subtotal, currency)}`;
    lines.push(`${itemLine}\n`);
    lines.push(`  ${formatMoney(item.unitPrice, currency)} each`);
    if (item.tax > 0) {
      lines.push(` (+${item.tax}% tax)`);
    }
    lines.push(`  ${amountLine}\n`);
  });

  lines.push(`${line}\n`);
  lines.push(`Subtotal: ${formatMoney(order.subtotal, currency)}\n`);
  lines.push(`Tax: ${formatMoney(order.tax, currency)}\n`);
  lines.push(`TOTAL: ${formatMoney(order.total, currency)}\n`);
  lines.push(`${line}\n`);
  lines.push(`Thank you!\n\n\n`);

  return lines.join('');
};

const getEscPosModule = () => {
  try {
    return require('react-native-bluetooth-escpos-printer');
  } catch {
    return null;
  }
};

const normalizeDevices = (raw: unknown): PrinterDevice[] => {
  if (!raw) return [];
  const list = Array.isArray(raw) ? raw : [];
  return list
    .map(item => {
      const name = item?.name || item?.deviceName || 'Unknown';
      const address = item?.address || item?.macAddress || '';
      return address ? { name, address } : null;
    })
    .filter(Boolean) as PrinterDevice[];
};

const fetchBondedDevices = async (): Promise<PrinterDevice[]> => {
  const escpos = getEscPosModule();
  if (!escpos?.BluetoothManager) return [];

  const result = await escpos.BluetoothManager.enableBluetooth();
  if (typeof result === 'string') {
    try {
      const parsed = JSON.parse(result);
      return normalizeDevices(parsed);
    } catch {
      return [];
    }
  }

  return normalizeDevices(result);
};

const scanDevices = async (): Promise<PrinterDevice[]> => {
  const escpos = getEscPosModule();
  if (!escpos?.BluetoothManager) return [];

  if (typeof escpos.BluetoothManager.scanDevices !== 'function') {
    return [];
  }

  const result = await escpos.BluetoothManager.scanDevices();
  if (typeof result === 'string') {
    try {
      const parsed = JSON.parse(result);
      const found = normalizeDevices(parsed?.found || []);
      const paired = normalizeDevices(parsed?.paired || []);
      return [...paired, ...found];
    } catch {
      return [];
    }
  }

  const found = normalizeDevices((result as any)?.found || []);
  const paired = normalizeDevices((result as any)?.paired || []);
  return [...paired, ...found];
};

const ensureConnected = async (address?: string): Promise<boolean> => {
  const escpos = getEscPosModule();
  if (!escpos?.BluetoothManager || !address) return false;

  try {
    await escpos.BluetoothManager.connect(address);
    return true;
  } catch {
    return false;
  }
};

const printEscPos = async (text: string): Promise<boolean> => {
  const escpos = getEscPosModule();
  const printer = escpos?.BluetoothEscposPrinter;
  if (!printer || typeof printer.printText !== 'function') return false;

  await printer.printText(text, {});
  return true;
};

export const printService = {
  getPrinterStatusLabel: (): string => {
    if (isExpoGo) {
      return 'Printer: Unsupported in Expo Go';
    }
    const selectedAddress = Storage.getString(StorageKeys.PRINTER_ADDRESS);
    if (!selectedAddress) {
      return 'Printer: Not connected';
    }
    return `Printer: ${selectedAddress}`;
  },

  isPrinterSupported: (): boolean => {
    return !isExpoGo;
  },

  getSelectedPrinter: (): string | undefined => {
    return Storage.getString(StorageKeys.PRINTER_ADDRESS);
  },

  setSelectedPrinter: (address: string): void => {
    Storage.setString(StorageKeys.PRINTER_ADDRESS, address);
  },

  listPrinters: async (): Promise<PrinterDevice[]> => {
    if (isExpoGo) return [];
    const bonded = await fetchBondedDevices();
    const scanned = await scanDevices();
    const merged = new Map<string, PrinterDevice>();
    [...bonded, ...scanned].forEach(device => {
      merged.set(device.address, device);
    });
    return Array.from(merged.values());
  },

  connectPrinter: async (address: string): Promise<boolean> => {
    if (isExpoGo) return false;
    const connected = await ensureConnected(address);
    if (connected) {
      Storage.setString(StorageKeys.PRINTER_ADDRESS, address);
    }
    return connected;
  },

  printOrder: async (order: Order): Promise<PrintResult> => {
    if (isExpoGo) {
      return {
        success: false,
        message: 'Printing requires a custom dev build. Expo Go does not support Bluetooth SPP.',
      };
    }
    const settings = settingsService.getSettings();
    const text = formatOrderText(
      order,
      settings.shopName || 'Tea & Juice Shop',
      settings.currency || 'USD'
    );

    const selectedAddress = Storage.getString(StorageKeys.PRINTER_ADDRESS);
    const connected = await ensureConnected(selectedAddress);
    if (connected) {
      const printed = await printEscPos(text);
      if (printed) {
        return { success: true };
      }
    }

    return {
      success: false,
      message:
        'Printer not connected. Open Printer Setup and connect your MTP-II device, then try again.',
    };
  },

  printTest: async (): Promise<PrintResult> => {
    if (isExpoGo) {
      return {
        success: false,
        message: 'Printing requires a custom dev build. Expo Go does not support Bluetooth SPP.',
      };
    }
    const sample: Order = {
      id: 'test_order',
      items: [
        {
          productId: 'test',
          productName: 'Test Item',
          quantity: 1,
          unitPrice: 1,
          tax: 0,
          subtotal: 1,
        },
      ],
      subtotal: 1,
      tax: 0,
      total: 1,
      timestamp: Date.now(),
      userId: 'test',
    };

    return printService.printOrder(sample);
  },
};
