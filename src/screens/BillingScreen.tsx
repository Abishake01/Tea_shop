import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useProducts } from '../context/ProductContext';
import { Order } from '../types';
import { orderService } from '../services/orderService';
import { colors, spacing, typography } from '../theme';
import ReceiptView from '../components/common/ReceiptView';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { printService } from '../services/printService';
import { settingsService } from '../services/settingsService';
import { CategoryDropdownFilter } from '../components/common/CategoryDropdown';
import ScreenHeader from '../components/common/ScreenHeader';
import ProductCard from '../components/common/ProductCard';
import FloatingCartButton from '../components/common/FloatingCartButton';
import CartBottomSheet from '../components/common/CartBottomSheet';
import { BottomTabParamList } from '../navigation/BottomTabNavigator';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RouteProp } from '@react-navigation/native';

const BillingScreen: React.FC = () => {
  const { user } = useAuth();
  const { items, clearCart, addItem, itemCount } = useCart();
  const { categories, getProductsByCategory, refreshAll } = useProducts();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isReceiptVisible, setIsReceiptVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const navigation = useNavigation<BottomTabNavigationProp<BottomTabParamList, 'Billing'>>();
  const route = useRoute<RouteProp<BottomTabParamList, 'Billing'>>();

  useFocusEffect(
    React.useCallback(() => {
      refreshAll();
      const receiptId = route.params?.openReceiptId;
      if (receiptId) {
        const order = orderService.getOrderById(receiptId);
        if (order) {
          setSelectedOrder(order);
          setIsReceiptVisible(true);
          if (settingsService.getSettings().autoPrintAfterCheckout) {
            void printService.printOrder(order);
          }
        }
        navigation.setParams({ openReceiptId: undefined });
      }
    }, [navigation, route.params?.openReceiptId])
  );

  const handleCheckout = () => {
    if (!user || items.length === 0) return;

    const newOrder = orderService.createOrder(items, user.id);
    clearCart();
    setIsCartOpen(false);
    setSelectedOrder(newOrder);
    setIsReceiptVisible(true);

    if (settingsService.getSettings().autoPrintAfterCheckout) {
      void printService.printOrder(newOrder);
    }
  };

  const handlePrint = async () => {
    if (!selectedOrder) return;
    const result = await printService.printOrder(selectedOrder);
    if (!result.success && result.message) {
      Alert.alert('Print Not Available', result.message);
    }
  };

  const filteredProducts = getProductsByCategory(selectedCategory);

  return (
    <View style={styles.container}>
      <ScreenHeader title="Billing" />

      <View style={styles.checkoutContainer}>
        <View style={styles.categoryRow}>
          <CategoryDropdownFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        </View>
        <FlatList
          data={filteredProducts}
          renderItem={({ item }) => (
            <ProductCard product={item} onPress={addItem} />
          )}
          keyExtractor={item => item.id}
          numColumns={3}
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
        <FloatingCartButton
          itemCount={itemCount}
          onPress={() => setIsCartOpen(true)}
        />
        <CartBottomSheet
          visible={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          onCheckout={handleCheckout}
        />
      </View>

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
              <TouchableOpacity onPress={() => { setIsReceiptVisible(false); setIsCartOpen(false); }}>
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
    padding: spacing.md,
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
  checkoutContainer: {
    flex: 1,
  },
  categoryRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
  },
  listContent: {
    padding: spacing.sm,
    paddingBottom: 96,
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
