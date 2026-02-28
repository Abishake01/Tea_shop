import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Order, OrderItem } from '../../types';
import { colors, spacing, typography } from '../../theme';
import { settingsService } from '../../services/settingsService';

interface TokenTicketProps {
  order: Order;
  mode?: 'single' | 'multi';
}

const padToken = (tokenNumber?: number) => {
  if (tokenNumber == null) return '---';
  return tokenNumber.toString().padStart(3, '0');
};

const expandItemsForTokens = (items: OrderItem[]): OrderItem[] => {
  const expanded: OrderItem[] = [];
  items.forEach(item => {
    for (let i = 0; i < item.quantity; i += 1) {
      expanded.push({ ...item, quantity: 1 });
    }
  });
  return expanded;
};

const TokenCard: React.FC<{ itemLabel: string; tokenNumber?: number; shopName: string }> = ({
  itemLabel,
  tokenNumber,
  shopName,
}) => (
  <View style={styles.card}>
    <Text style={styles.shopName}>{shopName}</Text>
    <Text style={styles.itemName}>{itemLabel}</Text>
    <Text style={styles.tokenLabel}>Token No: {padToken(tokenNumber)}</Text>
    <View style={styles.tokenCircle}>
      <Text style={styles.tokenNumber}>{tokenNumber ?? '-'}</Text>
    </View>
    <Text style={styles.footer}>Thank you!</Text>
  </View>
);

export const TokenTicket: React.FC<TokenTicketProps> = ({ order, mode }) => {
  const settings = settingsService.getSettings();
  const ticketMode = mode || settings.tokenPrintMode || 'single';
  const shopName = settings.shopName || 'Retail Shop';

  const namesWithQty = order.items
    .map(item => `${item.productName} ×${item.quantity}`)
    .join('\n');

  if (ticketMode === 'multi') {
    const itemsWithTokens = order.items.some(i => i.tokenNumber != null)
      ? order.items
      : expandItemsForTokens(order.items);
    return (
      <View style={styles.container}>
        {itemsWithTokens.map((item, idx) => (
          <TokenCard
            key={`${item.productId}-${idx}`}
            itemLabel={item.productName}
            tokenNumber={item.tokenNumber ?? order.tokenNumber}
            shopName={shopName}
          />
        ))}
      </View>
    );
  }

  // Single token that lists all items together
  return (
    <View style={styles.container}>
      <TokenCard itemLabel={namesWithQty} tokenNumber={order.tokenNumber} shopName={shopName} />
      <View style={styles.itemsList}>
        {order.items.map((item, idx) => (
          <Text key={`${item.productId}-${idx}`} style={styles.itemLine}>
            • {item.productName} ×{item.quantity}
            {item.tokenNumber != null ? `  Token #${item.tokenNumber}` : ''}
          </Text>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.md,
    alignItems: 'center',
  },
  card: {
    width: 220,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  shopName: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  itemName: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.xs,
    textAlign: 'center',
    fontWeight: '700',
  },
  tokenLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  tokenCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  tokenNumber: {
    ...typography.h1,
    color: colors.text,
  },
  footer: {
    ...typography.bodySmall,
    color: colors.text,
  },
  itemsList: {
    width: '100%',
    alignItems: 'center',
    gap: spacing.xs,
  },
  itemLine: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});

export default TokenTicket;
