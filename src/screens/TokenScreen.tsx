import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useProducts } from '../context/ProductContext';
import { Order } from '../types';
import { orderService } from '../services/orderService';
import { colors, spacing, typography } from '../theme';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import ReceiptView from '../components/common/ReceiptView';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { printService } from '../services/printService';
import { settingsService } from '../services/settingsService';
import CategoryFilter from '../components/common/CategoryFilter';
import ProductCard from '../components/common/ProductCard';
import CartPanel from '../components/common/CartPanel';
import { BottomTabParamList } from '../navigation/BottomTabNavigator';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RouteProp } from '@react-navigation/native';

const TokenScreen: React.FC = () => {
  const { user } = useAuth();
  const { items, clearCart, total, addItem } = useCart();
  const { categories, getProductsByCategory } = useProducts();
  const [tokenOrders, setTokenOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isReceiptVisible, setIsReceiptVisible] = useState(false);
  const [currentToken, setCurrentToken] = useState<number>(0);
  const [filterStatus, setFilterStatus] = useState<'all' | 'preparing' | 'ready' | 'completed'>('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeTab, setActiveTab] = useState<'checkout' | 'orders'>('checkout');
  const navigation = useNavigation<BottomTabNavigationProp<BottomTabParamList, 'Token'>>();
  const route = useRoute<RouteProp<BottomTabParamList, 'Token'>>();

  useEffect(() => {
    loadTokenOrders();
    setCurrentToken(orderService.peekNextTokenNumber());
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadTokenOrders();
      setCurrentToken(orderService.peekNextTokenNumber());
      const receiptId = route.params?.openReceiptId;
      if (receiptId) {
        const order = orderService.getOrderById(receiptId);
        if (order) {
          setSelectedOrder(order);
          setIsReceiptVisible(true);
          setActiveTab('orders');
          if (settingsService.getSettings().autoPrintAfterCheckout) {
            void printService.printOrder(order);
          }
        }
        navigation.setParams({ openReceiptId: undefined });
      }
    }, [navigation, route.params?.openReceiptId])
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

  const handleCheckout = () => {
    if (!user || items.length === 0) return;

    const tokenNumber = orderService.getNextTokenNumber();
    const newOrder = orderService.createOrder(items, user.id, tokenNumber);
    clearCart();
    loadTokenOrders();
    setCurrentToken(orderService.peekNextTokenNumber());
    setSelectedOrder(newOrder);
    setIsReceiptVisible(true);
    setActiveTab('orders');

    if (settingsService.getSettings().autoPrintAfterCheckout) {
      void printService.printOrder(newOrder);
    }
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
      Alert.alert('Print Not Available', result.message);
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

  const filteredProducts = getProductsByCategory(selectedCategory);
  const totalSales = tokenOrders.reduce((sum, order) => sum + order.total, 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Token Orders</Text>
          <Text style={styles.currentToken}>Current Token: #{currentToken}</Text>
        </View>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'checkout' && styles.tabButtonActive]}
          onPress={() => setActiveTab('checkout')}
        >
          <Text style={[styles.tabText, activeTab === 'checkout' && styles.tabTextActive]}>
            Checkout
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'orders' && styles.tabButtonActive]}
          onPress={() => setActiveTab('orders')}
        >
          <Text style={[styles.tabText, activeTab === 'orders' && styles.tabTextActive]}>
            Orders
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'checkout' ? (
        <View style={styles.checkoutContainer}>
          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
          <FlatList
            data={filteredProducts}
            renderItem={({ item }) => (
              <ProductCard product={item} onPress={addItem} />
            )}
            keyExtractor={item => item.id}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={styles.emptyContent}>
                  <Text style={styles.emptyText}>No products available</Text>
                  <Text style={styles.emptySubtext}>
                    {selectedCategory === 'all'
                      ? 'Add products in the Product screen'
                      : `No products in ${selectedCategory} category`}
                  </Text>
                </View>
              </View>
            }
          />
          <CartPanel onCheckout={handleCheckout} />
        </View>
      ) : (
        <View style={styles.ordersContainer}>
          <View style={styles.summaryContainer}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Total Tokens</Text>
              <Text style={styles.summaryValue}>{tokenOrders.length}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Total Sales</Text>
              <Text style={styles.summaryValue}>{formatCurrency(totalSales)}</Text>
            </View>
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
                  Create token orders from the Token checkout
                </Text>
              </View>
            }
          />
        </View>
      )}

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
          {selectedOrder && (
            <ReceiptView
              order={selectedOrder}
              printerStatus={printService.getPrinterStatusLabel()}
            />
          )}
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
  tabContainer: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 8,
    backgroundColor: colors.border,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  tabTextActive: {
    color: colors.surface,
  },
  checkoutContainer: {
    flex: 1,
  },
  ordersContainer: {
    flex: 1,
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  summaryContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  summaryValue: {
    ...typography.h2,
    color: colors.primary,
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
  emptyContent: {
    alignItems: 'center',
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
