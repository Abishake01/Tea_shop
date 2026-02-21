import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Order } from '../types';
import { orderService } from '../services/orderService';
import { colors, spacing, typography } from '../theme';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import ReceiptView from '../components/common/ReceiptView';
import { useFocusEffect } from '@react-navigation/native';
import { printService } from '../services/printService';

const TokenScreen: React.FC = () => {
  const { user } = useAuth();
  const { items, clearCart, total } = useCart();
  const [tokenOrders, setTokenOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isReceiptVisible, setIsReceiptVisible] = useState(false);
  const [currentToken, setCurrentToken] = useState<number>(0);
  const [filterStatus, setFilterStatus] = useState<'all' | 'preparing' | 'ready' | 'completed'>('all');

  useEffect(() => {
    loadTokenOrders();
    setCurrentToken(orderService.peekNextTokenNumber());
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadTokenOrders();
      setCurrentToken(orderService.peekNextTokenNumber());
    }, [])
  );

  const loadTokenOrders = () => {
    const allTokenOrders = orderService.getTokenOrders();
    // Sort by token number, highest first
    const sorted = [...allTokenOrders].sort((a, b) => {
      const tokenA = a.tokenNumber || 0;
      const tokenB = b.tokenNumber || 0;
      return tokenB - tokenA;
    });
    setTokenOrders(sorted);
  };

  const handleCreateTokenOrder = () => {
    if (!user || items.length === 0) return;

    const tokenNumber = orderService.getNextTokenNumber();
    const newOrder = orderService.createOrder(items, user.id, tokenNumber);
    clearCart();
    loadTokenOrders();
    setCurrentToken(orderService.peekNextTokenNumber());
    setSelectedOrder(newOrder);
    setIsReceiptVisible(true);
  };

  const handleUpdateStatus = (orderId: string, newStatus: 'preparing' | 'ready' | 'completed') => {
    orderService.updateOrderStatus(orderId, newStatus);
    loadTokenOrders();
  };

  const handleViewReceipt = (order: Order) => {
    setSelectedOrder(order);
    setIsReceiptVisible(true);
  };

  const handlePrint = async () => {
    if (!selectedOrder) return;
    const result = await printService.printOrder(selectedOrder);
    if (!result.success && result.message) {
      alert(result.message);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'ready':
        return colors.success;
      case 'completed':
        return colors.textSecondary;
      case 'preparing':
      default:
        return colors.accent;
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'ready':
        return 'Ready';
      case 'completed':
        return 'Completed';
      case 'preparing':
      default:
        return 'Preparing';
    }
  };

  const filteredOrders = tokenOrders.filter(order => {
    if (filterStatus === 'all') return true;
    return order.status === filterStatus;
  });

  const renderTokenOrder = ({ item }: { item: Order }) => (
    <View style={styles.tokenCard}>
      <View style={styles.tokenHeader}>
        <View style={styles.tokenNumberContainer}>
          <Text style={styles.tokenLabel}>Token</Text>
          <Text style={styles.tokenNumber}>#{item.tokenNumber}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        >
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>

      <View style={styles.orderInfo}>
        <Text style={styles.orderTotal}>{formatCurrency(item.total)}</Text>
        <Text style={styles.orderTime}>{formatDateTime(item.timestamp)}</Text>
      </View>

      <View style={styles.orderItems}>
        <Text style={styles.itemsLabel}>Items:</Text>
        {item.items.slice(0, 2).map((orderItem, idx) => (
          <Text key={idx} style={styles.itemText}>
            • {orderItem.productName} × {orderItem.quantity}
          </Text>
        ))}
        {item.items.length > 2 && (
          <Text style={styles.moreItems}>+{item.items.length - 2} more</Text>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.viewButton}
          onPress={() => handleViewReceipt(item)}
        >
          <Text style={styles.viewButtonText}>View Receipt</Text>
        </TouchableOpacity>

        {item.status === 'preparing' && (
          <TouchableOpacity
            style={[styles.statusButton, { backgroundColor: colors.success }]}
            onPress={() => handleUpdateStatus(item.id, 'ready')}
          >
            <Text style={styles.statusButtonText}>Mark Ready</Text>
          </TouchableOpacity>
        )}

        {item.status === 'ready' && (
          <TouchableOpacity
            style={[styles.statusButton, { backgroundColor: colors.textSecondary }]}
            onPress={() => handleUpdateStatus(item.id, 'completed')}
          >
            <Text style={styles.statusButtonText}>Mark Completed</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Token Orders</Text>
          <Text style={styles.currentToken}>Current Token: #{currentToken}</Text>
        </View>
        {items.length > 0 && (
          <TouchableOpacity style={styles.createButton} onPress={handleCreateTokenOrder}>
            <Text style={styles.createButtonText}>
              Create Token ({formatCurrency(total)})
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {(['all', 'preparing', 'ready', 'completed'] as const).map(status => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterChip,
                filterStatus === status && styles.filterChipActive,
              ]}
              onPress={() => setFilterStatus(status)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filterStatus === status && styles.filterChipTextActive,
                ]}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredOrders}
        renderItem={renderTokenOrder}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No token orders yet</Text>
            <Text style={styles.emptySubtext}>
              Create token orders from the Home screen
            </Text>
          </View>
        }
      />

      <Modal
        visible={isReceiptVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsReceiptVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Token Receipt</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={handlePrint}>
                <Text style={styles.printButton}>Print</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setIsReceiptVisible(false)}>
                <Text style={styles.closeButton}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
          {selectedOrder && <ReceiptView order={selectedOrder} />}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    ...typography.h1,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  currentToken: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '600',
  },
  createButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  createButtonText: {
    ...typography.button,
    color: colors.surface,
  },
  filterContainer: {
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.border,
    marginLeft: spacing.sm,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
  },
  filterChipText: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: colors.surface,
    fontWeight: '600',
  },
  listContent: {
    padding: spacing.md,
  },
  tokenCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tokenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  tokenNumberContainer: {
    alignItems: 'flex-start',
  },
  tokenLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  tokenNumber: {
    ...typography.h1,
    color: colors.accent,
    fontSize: 28,
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 16,
  },
  statusText: {
    ...typography.caption,
    color: colors.surface,
    fontWeight: '600',
  },
  orderInfo: {
    marginBottom: spacing.sm,
  },
  orderTotal: {
    ...typography.h3,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  orderTime: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  orderItems: {
    marginBottom: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  itemsLabel: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  itemText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  moreItems: {
    ...typography.caption,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  viewButton: {
    flex: 1,
    backgroundColor: colors.primary,
    padding: spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewButtonText: {
    ...typography.button,
    color: colors.surface,
    fontSize: 14,
  },
  statusButton: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
  },
  statusButtonText: {
    ...typography.button,
    color: colors.surface,
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyText: {
    ...typography.h2,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    ...typography.h1,
    color: colors.text,
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  printButton: {
    ...typography.body,
    color: colors.accent,
    fontWeight: '600',
  },
  closeButton: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
});

export default TokenScreen;
