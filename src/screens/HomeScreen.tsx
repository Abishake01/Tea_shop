import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Alert } from 'react-native';
import { useProducts } from '../context/ProductContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { orderService } from '../services/orderService';
import { settingsService } from '../services/settingsService';
import { colors, spacing } from '../theme';
import ProductCard from '../components/common/ProductCard';
import { CategoryDropdownFilter } from '../components/common/CategoryDropdown';
import ScreenHeader from '../components/common/ScreenHeader';
import FloatingCartButton from '../components/common/FloatingCartButton';
import CartBottomSheet from '../components/common/CartBottomSheet';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { BottomTabParamList } from '../navigation/BottomTabNavigator';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type HomeScreenNavigationProp = NativeStackNavigationProp<BottomTabParamList, 'Home'>;

const HomeScreen: React.FC = () => {
  const { activeProducts, categories, getProductsByCategory, refreshAll } = useProducts();
  const { addItem, items, clearCart, itemCount } = useCart();
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const navigation = useNavigation<HomeScreenNavigationProp>();

  // Refresh products whenever screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      refreshAll();
    }, [])
  );

  const filteredProducts = getProductsByCategory(selectedCategory);

  const handleProductPress = (product: any) => {
    addItem(product);
  };

  const handleCheckout = () => {
    if (!user || items.length === 0) {
      Alert.alert('Error', 'Cart is empty');
      return;
    }

    Alert.alert(
      'Checkout',
      'Choose checkout type:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Regular Order',
          onPress: () => {
            const newOrder = orderService.createOrder(items, user.id);
            clearCart();
            navigation.navigate('Billing', { openReceiptId: newOrder.id });
          },
        },
        {
          text: 'Token Order',
          onPress: () => {
            const tokenNumber = orderService.getNextTokenNumber();
            const newOrder = orderService.createOrder(items, user.id, tokenNumber);
            clearCart();
            navigation.navigate('Token', { openReceiptId: newOrder.id });
          },
        },
      ]
    );
  };

  const shopName = settingsService.getSettings().shopName || 'Tea & Juice Shop';

  return (
    <View style={styles.container}>
      <ScreenHeader title={shopName} />
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
          <ProductCard product={item} onPress={handleProductPress} />
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    paddingVertical: spacing.sm,
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
    fontSize: 18,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});

export default HomeScreen;
