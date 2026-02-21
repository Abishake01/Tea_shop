import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
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
import CategoryFilter from '../components/common/CategoryFilter';
import ProductCard from '../components/common/ProductCard';
import CartPanel from '../components/common/CartPanel';
import { BottomTabParamList } from '../navigation/BottomTabNavigator';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RouteProp } from '@react-navigation/native';

const BillingScreen: React.FC = () => {
  const { user } = useAuth();
  const { items, clearCart, total, addItem } = useCart();
  const { categories, getProductsByCategory } = useProducts();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isReceiptVisible, setIsReceiptVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeTab, setActiveTab] = useState<'checkout' | 'orders'>('checkout');
  const navigation = useNavigation<BottomTabNavigationProp<BottomTabParamList, 'Billing'>>();
  const route = useRoute<RouteProp<BottomTabParamList, 'Billing'>>();

  useEffect(() => {
    loadOrders();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadOrders();
      const receiptId = route.params?.openReceiptId;
      if (receiptId) {
        const order = orderService.getOrderById(receiptId);
        if (order) {
          setSelectedOrder(order);
          setIsReceiptVisible(true);
          setActiveTab('orders');
        }
        navigation.setParams({ openReceiptId: undefined });
      }
    }, [navigation, route.params?.openReceiptId])
  );

  const loadOrders = () => {
    const allOrders = orderService.getBillingOrders();
    // Sort by timestamp, newest first
    const sorted = [...allOrders].sort((a, b) => b.timestamp - a.timestamp);
    setOrders(sorted);
  };

  const handleCheckout = () => {
    if (!user || items.length === 0) return;

    const newOrder = orderService.createOrder(items, user.id);
    clearCart();
    loadOrders();
    setSelectedOrder(newOrder);
    setIsReceiptVisible(true);
    setActiveTab('orders');
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

  const filteredOrders = orders.filter(order => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      order.id.toLowerCase().includes(query) ||
      order.items.some(item => item.productName.toLowerCase().includes(query))
    );
  });

  const renderOrderItem = ({ item }: { item: Order }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => handleViewReceipt(item)}
    >
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>Order #{item.id.split('_')[1]}</Text>
        <Text style={styles.orderTotal}>{formatCurrency(item.total)}</Text>
      </View>
      <Text style={styles.orderDate}>{formatDateTime(item.timestamp)}</Text>
      <Text style={styles.orderItems}>
        {item.items.length} item{item.items.length !== 1 ? 's' : ''}
      </Text>
    </TouchableOpacity>
  );

  const filteredProducts = getProductsByCategory(selectedCategory);
  const totalSales = orders.reduce((sum, order) => sum + order.total, 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Billing</Text>
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
              <Text style={styles.summaryLabel}>Total Orders</Text>
              <Text style={styles.summaryValue}>{orders.length}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Total Sales</Text>
              <Text style={styles.summaryValue}>{formatCurrency(totalSales)}</Text>
            </View>
          </View>

          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search orders..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <FlatList
            data={filteredOrders}
            renderItem={renderOrderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No orders yet</Text>
                <Text style={styles.emptySubtext}>
                  Complete orders from the Billing checkout
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
            <Text style={styles.modalTitle}>Receipt</Text>
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
  searchContainer: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchInput: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: spacing.md,
    ...typography.body,
    color: colors.text,
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
  listContent: {
    padding: spacing.md,
  },
  orderCard: {
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
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  orderId: {
    ...typography.h3,
    color: colors.text,
  },
  orderTotal: {
    ...typography.h3,
    color: colors.primary,
  },
  orderDate: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  orderItems: {
    ...typography.bodySmall,
    color: colors.textSecondary,
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

export default BillingScreen;
