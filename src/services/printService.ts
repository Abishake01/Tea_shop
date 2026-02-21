import { Order } from '../types';
import { settingsService } from './settingsService';

type PrintResult = {
  success: boolean;
  message?: string;
};

const line = '--------------------------------';

const formatCurrency = (amount: number): string => {
  return `$${amount.toFixed(2)}`;
};

const formatOrderText = (order: Order, shopName: string): string => {
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
    const amountLine = `${formatCurrency(item.subtotal)}`;
    lines.push(`${itemLine}\n`);
    lines.push(`  ${formatCurrency(item.unitPrice)} each`);
    if (item.tax > 0) {
      lines.push(` (+${item.tax}% tax)`);
    }
    lines.push(`  ${amountLine}\n`);
  });

  lines.push(`${line}\n`);
  lines.push(`Subtotal: ${formatCurrency(order.subtotal)}\n`);
  lines.push(`Tax: ${formatCurrency(order.tax)}\n`);
  lines.push(`TOTAL: ${formatCurrency(order.total)}\n`);
  lines.push(`${line}\n`);
  lines.push(`Thank you!\n\n\n`);

  return lines.join('');
};

const tryThermalPrinter = async (text: string): Promise<boolean> => {
  try {
    const printerModule = require('react-native-thermal-receipt-printer-image-qr');
    const blePrinter = printerModule?.BLEPrinter;
    if (blePrinter && typeof blePrinter.printText === 'function') {
      await blePrinter.printText(text);
      return true;
    }
  } catch {
    return false;
  }
  return false;
};

const tryBluetoothEscPosPrinter = async (text: string): Promise<boolean> => {
  try {
    const printerModule = require('react-native-bluetooth-escpos-printer');
    const printer = printerModule?.BluetoothEscposPrinter;
    if (printer && typeof printer.printText === 'function') {
      await printer.printText(text, {});
      return true;
    }
  } catch {
    return false;
  }
  return false;
};

export const printService = {
  printOrder: async (order: Order): Promise<PrintResult> => {
    const settings = settingsService.getSettings();
    const text = formatOrderText(order, settings.shopName || 'Tea & Juice Shop');

    const thermalPrinted = await tryThermalPrinter(text);
    if (thermalPrinted) {
      return { success: true };
    }

    const escPosPrinted = await tryBluetoothEscPosPrinter(text);
    if (escPosPrinted) {
      return { success: true };
    }

    return {
      success: false,
      message:
        'No ESC/POS Bluetooth printer module is available in this build. For Bluetooth SPP printing, install a native printer package and run a custom dev build (not Expo Go).',
    };
  },
};
