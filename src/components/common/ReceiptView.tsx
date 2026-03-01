import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Order } from '../../types';
import { colors, spacing, typography } from '../../theme';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { formatMoneyForPrinter, formatDateForPrinter } from '../../services/printService';

interface ReceiptViewProps {
  order: Order;
  shopName?: string;
  printerStatus?: string;
  /** When true, shows Rs, DD/MM/YYYY, x - matches thermal printer output */
  printerPreview?: boolean;
}

const isComplimentOrder = (order: Order) => order.isCompliment === true || order.total === 0;

const ReceiptView: React.FC<ReceiptViewProps> = ({
  order,
  shopName = 'Tea & Juice Shop',
  printerStatus,
  printerPreview = false,
}) => {
  const compliment = isComplimentOrder(order);
  const formatMoney = printerPreview ? formatMoneyForPrinter : (a: number) => formatCurrency(a);
  const formatDate = printerPreview ? formatDateForPrinter : formatDateTime;
  const timesSymbol = printerPreview ? 'x' : '×';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.receipt}>
        <Text style={styles.shopName}>{shopName}</Text>
        {printerStatus ? (
          <Text style={styles.printerStatus}>{printerStatus}</Text>
        ) : null}
        <Text style={styles.divider}>━━━━━━━━━━━━━━━━━━━━</Text>
        
        <Text style={styles.label}>Order #{order.id.split('_')[1]}</Text>
        {order.tokenNumber && (
          <Text style={styles.label}>Token: #{order.tokenNumber}</Text>
        )}
        {compliment && (
          <Text style={styles.complimentLabel}>Complimentary</Text>
        )}
        <Text style={styles.date}>{formatDate(order.timestamp)}</Text>
        <Text style={styles.divider}>━━━━━━━━━━━━━━━━━━━━</Text>

        <View style={styles.items}>
          {order.items.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <View style={styles.itemLeft}>
                <Text style={styles.itemName}>{item.productName}</Text>
                <Text style={styles.itemDetails}>
                  {item.quantity} {timesSymbol} {compliment ? 'Complimentary' : formatMoney(item.unitPrice)}
                  {item.tax > 0 && !compliment && ` (+${item.tax}% tax)`}
                  {item.tokenNumber != null && ` · Token #${item.tokenNumber}`}
                </Text>
              </View>
              <Text style={styles.itemTotal}>{formatMoney(compliment ? 0 : item.subtotal)}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.divider}>━━━━━━━━━━━━━━━━━━━━</Text>

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>{formatMoney(compliment ? 0 : order.subtotal)}</Text>
          </View>
          {(order.tax > 0 || compliment) && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax:</Text>
              <Text style={styles.totalValue}>{formatMoney(compliment ? 0 : order.tax)}</Text>
            </View>
          )}
          <View style={[styles.totalRow, styles.finalTotal]}>
            <Text style={styles.finalTotalLabel}>TOTAL:</Text>
            <Text style={styles.finalTotalValue}>{formatMoney(compliment ? 0 : order.total)}</Text>
          </View>
        </View>

        <Text style={styles.divider}>━━━━━━━━━━━━━━━━━━━━</Text>
        <Text style={styles.thankYou}>Thank you for your visit!</Text>
        <Text style={styles.footer}>Have a great day!</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  receipt: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: 8,
    width: '100%',
    maxWidth: 400,
    // Thermal receipt style - narrow width
    minWidth: 280,
  },
  shopName: {
    ...typography.receipt,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.xs,
    color: colors.text,
  },
  printerStatus: {
    ...typography.receipt,
    textAlign: 'center',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  divider: {
    ...typography.receipt,
    textAlign: 'center',
    color: colors.text,
    marginVertical: spacing.sm,
  },
  label: {
    ...typography.receipt,
    textAlign: 'center',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  complimentLabel: {
    ...typography.receipt,
    textAlign: 'center',
    color: colors.primary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  date: {
    ...typography.receipt,
    textAlign: 'center',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    fontSize: 10,
  },
  items: {
    marginVertical: spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  itemLeft: {
    flex: 1,
    marginRight: spacing.sm,
  },
  itemName: {
    ...typography.receipt,
    color: colors.text,
    fontWeight: '500',
  },
  itemDetails: {
    ...typography.receipt,
    fontSize: 10,
    color: colors.textSecondary,
  },
  itemTotal: {
    ...typography.receipt,
    color: colors.text,
    fontWeight: '500',
  },
  totals: {
    marginTop: spacing.sm,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  totalLabel: {
    ...typography.receipt,
    color: colors.text,
  },
  totalValue: {
    ...typography.receipt,
    color: colors.text,
  },
  finalTotal: {
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  finalTotalLabel: {
    ...typography.receipt,
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  finalTotalValue: {
    ...typography.receipt,
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  thankYou: {
    ...typography.receipt,
    textAlign: 'center',
    marginTop: spacing.md,
    color: colors.text,
    fontWeight: '500',
  },
  footer: {
    ...typography.receipt,
    textAlign: 'center',
    marginTop: spacing.xs,
    color: colors.textSecondary,
    fontSize: 10,
  },
});

export default ReceiptView;

