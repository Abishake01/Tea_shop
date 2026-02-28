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

const groupItemsByProduct = (
  items: OrderItem[]
): Array<{ productName: string; quantity: number; tokenNumbers: number[] }> => {
  const map = new Map<string, { productName: string; quantity: number; tokenNumbers: number[] }>();
  items.forEach(item => {
    const existing = map.get(item.productId);
    if (existing) {
      existing.quantity += item.quantity;
      if (item.tokenNumber != null) existing.tokenNumbers.push(item.tokenNumber);
    } else {
      map.set(item.productId, {
        productName: item.productName,
        quantity: item.quantity,
        tokenNumbers: item.tokenNumber != null ? [item.tokenNumber] : [],
      });
    }
  });
  return Array.from(map.values());
};

const TokenCard: React.FC<{ itemLabel: string; tokenNumber?: number; shopName: string; isCompliment?: boolean }> = ({
  itemLabel,
  tokenNumber,
  shopName,
  isCompliment,
}) => (
  <View style={styles.card}>
    <Text style={styles.shopName}>{shopName}</Text>
    {isCompliment && <Text style={styles.complimentLabel}>Complimentary</Text>}
    <Text style={styles.itemName}>{itemLabel}</Text>
    <Text style={styles.tokenLabel}>Token No: {padToken(tokenNumber)}</Text>
    <View style={styles.tokenCircle}>
      <Text style={styles.tokenNumber}>{tokenNumber ?? '-'}</Text>
    </View>
    <Text style={styles.footer}>Thank you!</Text>
  </View>
);

const isComplimentOrder = (order: Order) => order.isCompliment === true || order.total === 0;

export const TokenTicket: React.FC<TokenTicketProps> = ({ order, mode }) => {
  const settings = settingsService.getSettings();
  const ticketMode = mode || settings.tokenPrintMode || 'single';
  const shopName = settings.shopName || 'Retail Shop';
  const compliment = isComplimentOrder(order);

  const groupedItems = groupItemsByProduct(order.items);
  const namesWithQty = groupedItems
    .map(g => `${g.productName} ×${g.quantity}`)
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
            isCompliment={compliment}
          />
        ))}
      </View>
    );
  }

  // Single token that lists all items together (grouped by product)
  return (
    <View style={styles.container}>
      <TokenCard itemLabel={namesWithQty} tokenNumber={order.tokenNumber} shopName={shopName} isCompliment={compliment} />
      <View style={styles.itemsList}>
        {groupedItems.map((g, idx) => (
          <Text key={`${g.productName}-${idx}`} style={styles.itemLine}>
            • {g.productName} ×{g.quantity}
            {g.tokenNumbers.length > 0
              ? `  Token ${g.tokenNumbers.map(t => `#${t}`).join(', ')}`
              : ''}
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
  complimentLabel: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  itemName: {
    ...typography.h3,
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
