import { Order } from '../types';
import { settingsService } from './settingsService';
import { Storage, StorageKeys } from './storage';
import { formatCurrency } from '../utils/formatters';
import { Platform, PermissionsAndroid, NativeModules } from 'react-native';

type PrintResult = {
  success: boolean;
  message?: string;
};

type PrinterDevice = {
  name: string;
  address: string;
};

// Request Bluetooth permissions for Android 12+ (API 31+)
const requestBluetoothPermissions = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    return true;
  }

  // Android 12+ requires runtime permissions for Bluetooth
  if (Platform.Version >= 31) {
    try {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);

      const allGranted =
        granted['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED &&
        granted['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED &&
        granted['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED;

      return allGranted;
    } catch (err) {
      console.error('[PrintService] Permission request failed:', err);
      return false;
    }
  }

  // Android 11 and below - permissions are granted via manifest
  return true;
};

const line = '--------------------------------';

const formatMoney = (amount: number, currency: string): string => {
  try {
    return formatCurrency(amount, currency);
  } catch {
    return `₹${amount.toFixed(2)}`;
  }
};

const padToken = (tokenNumber?: number) => {
  if (tokenNumber == null) return '---';
  return tokenNumber.toString().padStart(3, '0');
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

const getTokenItemLabel = (order: Order): string => {
  // Similar to the TokenTicket preview: show item names with qty.
  if (!order.items?.length) return '';
  return order.items.map(item => `${item.productName} ×${item.quantity}`).join('\n');
};

const getEscPosModule = () => {
  // Guard: avoid requiring if native module isn't installed (prevents crashes in Expo/unsupported builds)
  if (Platform.OS !== 'android') return null;
  const hasNative =
    (NativeModules as any)?.BluetoothEscposPrinter ||
    (NativeModules as any)?.BluetoothManager;
  if (!hasNative) return null;

  try {
    const mod = require('react-native-bluetooth-escpos-printer');
    if (!mod || typeof mod !== 'object') return null;
    return mod;
  } catch (err) {
    console.warn('[PrintService] ESC/POS module not available', err);
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

  // Request permissions first (critical for Android 12+)
  const hasPermissions = await requestBluetoothPermissions();
  if (!hasPermissions) {
    throw new Error('Bluetooth permissions not granted. Please allow Bluetooth and Location permissions in Settings.');
  }

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

  // Permissions already requested in fetchBondedDevices
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

const printTokenTicketEscPos = async (order: Order, shopName: string): Promise<boolean> => {
  const escpos = getEscPosModule();
  const printer = escpos?.BluetoothEscposPrinter;
  if (!printer) return false;

  const ALIGN = (printer as any)?.ALIGN;
  const printerAlign = (printer as any)?.printerAlign;
  if (typeof printerAlign === 'function' && ALIGN?.CENTER != null) {
    await printerAlign(ALIGN.CENTER);
  }

  const itemsWithTokens = order.items.filter(i => i.tokenNumber != null);
  const multiMode = settingsService.getSettings().tokenPrintMode === 'multi' && itemsWithTokens.length > 0;

  if (multiMode && itemsWithTokens.length > 0) {
    for (const item of itemsWithTokens) {
      await printer.printText(`${shopName}\r\n`, { fonttype: 1 });
      await printer.printText(`${item.productName}\r\n`, { fonttype: 1 });
      await printer.printText(`Token No: ${padToken(item.tokenNumber)}\r\n\r\n`, { fonttype: 1 });
      const tokenNumText = item.tokenNumber == null ? '-' : String(item.tokenNumber);
      await printer.printText(`${tokenNumText}\r\n`, { fonttype: 1, widthtimes: 3, heigthtimes: 3 });
      await printer.printText(`\r\nThank you!\r\n\r\n\r\n`, { fonttype: 1 });
    }
    return true;
  }

  const itemLabel = getTokenItemLabel(order);
  await printer.printText(`${shopName}\r\n`, { fonttype: 1 });
  if (itemLabel) {
    await printer.printText(`${itemLabel}\r\n`, { fonttype: 1 });
  }
  const firstToken = order.tokenNumber ?? order.items.find(i => i.tokenNumber != null)?.tokenNumber;
  await printer.printText(`Token No: ${padToken(firstToken)}\r\n\r\n`, { fonttype: 1 });

  const tokenNumText = firstToken == null ? '-' : String(firstToken);
  await printer.printText(`${tokenNumText}\r\n`, { fonttype: 1, widthtimes: 3, heigthtimes: 3 });

  await printer.printText(`\r\nThank you!\r\n\r\n\r\n`, { fonttype: 1 });
  return true;
};

export const printService = {
  getPrinterStatusLabel: (): string => {
    const selectedAddress = Storage.getString(StorageKeys.PRINTER_ADDRESS);
    if (!selectedAddress) {
      return 'Printer: Not connected';
    }
    return `Printer: ${selectedAddress}`;
  },

  isPrinterSupported: (): boolean => {
    try {
      return getEscPosModule() !== null;
    } catch {
      return false;
    }
  },

  getSelectedPrinter: (): string | undefined => {
    return Storage.getString(StorageKeys.PRINTER_ADDRESS);
  },

  setSelectedPrinter: (address: string): void => {
    Storage.setString(StorageKeys.PRINTER_ADDRESS, address);
  },

  listPrinters: async (): Promise<PrinterDevice[]> => {
    const escpos = getEscPosModule();
    if (!escpos) return [];
    
    const bonded = await fetchBondedDevices();
    const scanned = await scanDevices();
    const merged = new Map<string, PrinterDevice>();
    [...bonded, ...scanned].forEach(device => {
      merged.set(device.address, device);
    });
    return Array.from(merged.values());
  },

  connectPrinter: async (address: string): Promise<boolean> => {
    const escpos = getEscPosModule();
    if (!escpos) return false;
    
    const connected = await ensureConnected(address);
    if (connected) {
      Storage.setString(StorageKeys.PRINTER_ADDRESS, address);
    }
    return connected;
  },

  printOrder: async (order: Order): Promise<PrintResult> => {
    const escpos = getEscPosModule();
    if (!escpos) {
      return {
        success: false,
        message: 'Printer module not available. Ensure you are using a development or production build.',
      };
    }
    
    const settings = settingsService.getSettings();
    const shopName = settings.shopName || 'Tea & Juice Shop';
    const currency = settings.currency || 'INR';

    const selectedAddress = Storage.getString(StorageKeys.PRINTER_ADDRESS);
    const connected = await ensureConnected(selectedAddress);
    if (connected) {
      const isTokenOrder =
        order.tokenNumber !== undefined ||
        order.items.some(item => item.tokenNumber !== undefined);
      if (isTokenOrder) {
        const printed = await printTokenTicketEscPos(order, shopName);
        if (printed) return { success: true };

        const firstToken = order.tokenNumber ?? order.items.find(i => i.tokenNumber != null)?.tokenNumber;
        const fallbackText = `${shopName}\n\n${getTokenItemLabel(order)}\n\nToken No: ${padToken(firstToken)}\n\n${firstToken ?? '-'}\n\nThank you!\n\n\n`;
        const printedFallback = await printEscPos(fallbackText);
        if (printedFallback) return { success: true };
      } else {
        const text = formatOrderText(order, shopName, currency);
        const printed = await printEscPos(text);
        if (printed) return { success: true };
      }
    }

    return {
      success: false,
      message:
        'Printer not connected. Open Printer Setup and connect your printer, then try again.',
    };
  },

  printTest: async (): Promise<PrintResult> => {
    const escpos = getEscPosModule();
    if (!escpos) {
      return {
        success: false,
        message: 'Printer module not available. Ensure you are using a development or production build.',
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
