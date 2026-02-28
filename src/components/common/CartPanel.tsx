import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { useCart } from '../../context/CartContext';
import type { PaymentMethod } from '../../context/CartContext';
import { colors, spacing, typography } from '../../theme';
import { formatCurrency } from '../../utils/formatters';

interface CartPanelProps {
  onCheckout: () => void;
}

const CartPanel: React.FC<CartPanelProps> = ({ onCheckout }) => {
  const {
    items,
    updateQuantity,
    removeItem,
    subtotal,
    tax,
    total,
    itemCount,
    clearCart,
    paymentMethod,
    setPaymentMethod,
    isCompliment,
    setIsCompliment,
  } = useCart();

  const handleIncreaseQuantity = (productId: string, currentQuantity: number) => {
    updateQuantity(productId, currentQuantity + 1);
  };

  const handleDecreaseQuantity = (productId: string, currentQuantity: number) => {
    if (currentQuantity > 1) {
      updateQuantity(productId, currentQuantity - 1);
    } else {
      Alert.alert('Remove Item', 'Remove this item from cart?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeItem(productId),
        },
      ]);
    }
  };

  if (itemCount === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Cart is empty</Text>
        <Text style={styles.emptySubtext}>Tap products to add items</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Cart ({itemCount})</Text>
        {items.length > 0 && (
          <TouchableOpacity onPress={clearCart}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.itemsContainer} nestedScrollEnabled>
        {items.map(item => (
          <View key={item.productId} style={styles.item}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName} numberOfLines={1}>
                {item.productName}
              </Text>
              <Text style={styles.itemPrice}>
                {formatCurrency(item.unitPrice)} × {item.quantity}
              </Text>
            </View>
            <View style={styles.quantityControls}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => handleDecreaseQuantity(item.productId, item.quantity)}
              >
                <Text style={styles.quantityButtonText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.quantityText}>{item.quantity}</Text>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => handleIncreaseQuantity(item.productId, item.quantity)}
              >
                <Text style={styles.quantityButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.summary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal:</Text>
          <Text style={styles.summaryValue}>{formatCurrency(subtotal)}</Text>
        </View>
        {tax > 0 && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tax:</Text>
            <Text style={styles.summaryValue}>{formatCurrency(tax)}</Text>
          </View>
        )}
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
        </View>
      </View>

      <View style={styles.paymentSection}>
        <Text style={styles.paymentLabel}>Payment</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.paymentChips}>
          {(['Cash', 'Card', 'Scanner', 'Bank Account'] as PaymentMethod[]).map(method => (
            <TouchableOpacity
              key={method}
              style={[styles.paymentChip, paymentMethod === method && styles.paymentChipActive]}
              onPress={() => setPaymentMethod(method)}
            >
              <Text style={[styles.paymentChipText, paymentMethod === method && styles.paymentChipTextActive]}>
                {method}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.complimentRow}>
        <Text style={styles.complimentLabel}>Compliment (0 amount)</Text>
        <Switch
          value={isCompliment}
          onValueChange={setIsCompliment}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={colors.surface}
        />
      </View>

      <TouchableOpacity style={styles.checkoutButton} onPress={onCheckout}>
        <Text style={styles.checkoutButtonText}>Checkout</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  emptyContainer: {
    padding: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...typography.h3,
    color: colors.text,
  },
  clearText: {
    ...typography.bodySmall,
    color: colors.error,
    fontWeight: '600',
  },
  itemsContainer: {
    flex: 1,
    padding: spacing.sm,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  itemName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  itemPrice: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    ...typography.body,
    color: colors.surface,
    fontWeight: '600',
    fontSize: 18,
  },
  quantityText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    minWidth: 30,
    textAlign: 'center',
  },
  summary: {
    padding: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  summaryLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  summaryValue: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '500',
  },
  totalRow: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalLabel: {
    ...typography.h3,
    color: colors.text,
  },
  totalValue: {
    ...typography.h3,
    color: colors.primary,
  },
  paymentSection: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  paymentLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  paymentChips: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  paymentChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.border,
  },
  paymentChipActive: {
    backgroundColor: colors.primary,
  },
  paymentChipText: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '600',
  },
  paymentChipTextActive: {
    color: colors.surface,
  },
  complimentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  complimentLabel: {
    ...typography.bodySmall,
    color: colors.text,
  },
  checkoutButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    alignItems: 'center',
    margin: spacing.md,
    borderRadius: 8,
    minHeight: 48,
    justifyContent: 'center',
  },
  checkoutButtonText: {
    ...typography.button,
    color: colors.surface,
  },
});

export default CartPanel;

