import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  Modal,
  ScrollView,
  Switch,
} from 'react-native';
import { useProducts } from '../context/ProductContext';
import { useAuth } from '../context/AuthContext';
import { Product } from '../types';
import { colors, spacing, typography } from '../theme';
import { imageService } from '../services/imageService';
import { validatePrice, validateTax, validateRequired, validateSKU } from '../utils/validators';
import { formatCurrency } from '../utils/formatters';
import ReportsScreen from './ReportsScreen';
import ProtectedRoute from '../components/common/ProtectedRoute';
import { CategoryDropdownProduct } from '../components/common/CategoryDropdown';
import ScreenHeader from '../components/common/ScreenHeader';

const DEFAULT_CATEGORY_COLOR = '#4A7C59';

const ProductScreen: React.FC = () => {
  const { products, categories, addProduct, updateProduct, deleteProduct, addCategory } = useProducts();
  const { isAdmin } = useAuth();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isReportsVisible, setIsReportsVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: '',
    sku: '',
    tax: '0',
    isActive: true,
    imageUri: '',
  });

  // Initialize category once categories are loaded
  useEffect(() => {
    if (categories.length > 0 && !formData.category) {
      setFormData(prev => ({
        ...prev,
        category: categories[0].name,
      }));
    }
  }, [categories]);

  // Redirect if not admin (though navigation should handle this)
  useEffect(() => {
    if (!isAdmin) {
      // This screen should only be accessible to admin via navigation
      // But we add this as a safety check
    }
  }, [isAdmin]);

  const handleAddProduct = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      price: '',
      category: categories[0]?.name || 'Other',
      sku: '',
      tax: '0',
      isActive: true,
      imageUri: '',
    });
    setIsModalVisible(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      category: product.category,
      sku: product.sku,
      tax: product.tax.toString(),
      isActive: product.isActive,
      imageUri: product.imageUri || '',
    });
    setIsModalVisible(true);
  };

  const handleDeleteProduct = (product: Product) => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${product.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteProduct(product.id);
          },
        },
      ]
    );
  };

  const handlePickImage = async () => {
    Alert.alert(
      'Select Image',
      'Choose an option',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Camera',
          onPress: async () => {
            const uri = await imageService.pickFromCamera();
            if (uri) {
              setFormData({ ...formData, imageUri: uri });
            }
          },
        },
        {
          text: 'Gallery',
          onPress: async () => {
            const uri = await imageService.pickImage();
            if (uri) {
              setFormData({ ...formData, imageUri: uri });
            }
          },
        },
      ]
    );
  };

  const handleAddNewCategory = () => {
    const name = newCategoryName.trim();
    if (!name) {
      Alert.alert('Error', 'Enter a category name');
      return;
    }
    if (categories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
      Alert.alert('Error', 'This category already exists');
      return;
    }
    addCategory({ name, color: DEFAULT_CATEGORY_COLOR });
    setFormData(prev => ({ ...prev, category: name }));
    setNewCategoryName('');
  };

  const handleSaveProduct = () => {
    // Validation
    if (!validateRequired(formData.name)) {
      Alert.alert('Error', 'Product name is required');
      return;
    }
    if (!validateSKU(formData.sku)) {
      Alert.alert('Error', 'Valid SKU is required');
      return;
    }
    if (!validateRequired(formData.category)) {
      Alert.alert('Error', 'Please select or add a category');
      return;
    }
    const price = parseFloat(formData.price);
    if (!validatePrice(price)) {
      Alert.alert('Error', 'Valid price is required');
      return;
    }
    const tax = parseFloat(formData.tax);
    if (!validateTax(tax)) {
      Alert.alert('Error', 'Tax must be between 0 and 100');
      return;
    }

    const productData = {
      name: formData.name.trim(),
      price,
      category: formData.category,
      sku: formData.sku.trim(),
      tax,
      isActive: formData.isActive,
      imageUri: formData.imageUri || undefined,
    };

    if (editingProduct) {
      updateProduct(editingProduct.id, productData);
    } else {
      addProduct(productData);
    }

    setIsModalVisible(false);
  };

  const renderProductItem = ({ item }: { item: Product }) => (
    <View style={styles.productCard}>
      <View style={styles.productImageContainer}>
        {item.imageUri ? (
          <Image source={{ uri: item.imageUri }} style={styles.productImage} />
        ) : (
          <View style={[styles.productImage, styles.placeholderImage]}>
            <Text style={styles.placeholderText}>No Image</Text>
          </View>
        )}
        <View style={styles.productActionsOverImage}>
          <TouchableOpacity
            style={[styles.actionIconButton, styles.editButton]}
            onPress={() => handleEditProduct(item)}
          >
            <Text style={styles.actionIconText}>✎</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionIconButton, styles.deleteButton]}
            onPress={() => handleDeleteProduct(item)}
          >
            <Text style={styles.actionIconText}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.productSku}>SKU: {item.sku}</Text>
        <Text style={styles.productPrice}>{formatCurrency(item.price)}</Text>
        <Text style={styles.productCategory}>Category: {item.category}</Text>
        <Text style={styles.productTax}>Tax: {item.tax}%</Text>
      </View>
    </View>
  );

  return (
    <ProtectedRoute requireAdmin>
      <View style={styles.container}>
      <ScreenHeader
        title="Product"
        rightElement={
          <>
         
            <TouchableOpacity style={styles.headerActionButton} onPress={handleAddProduct}>
              <Text style={styles.headerActionButtonText}>+ Add Product</Text>
            </TouchableOpacity>
          </>
        }
      />

      <FlatList
        data={products}
        renderItem={renderProductItem}
        keyExtractor={item => item.id}
        numColumns={2}
        columnWrapperStyle={styles.productRow}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No products yet</Text>
            <Text style={styles.emptySubtext}>Tap "+ Add Product" to create one</Text>
          </View>
        }
      />

      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingProduct ? 'Edit Product' : 'Add Product'}
            </Text>
            <TouchableOpacity onPress={() => setIsModalVisible(false)}>
              <Text style={styles.modalCloseButton}>Close</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalContent}
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={true}
          >
            <View style={styles.formGroup}>
              <Text style={styles.label}>Product Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter product name"
                value={formData.name}
                onChangeText={text => setFormData({ ...formData, name: text })}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>SKU *</Text>
              <View style={styles.skuImageRow}>
                <TextInput
                  style={styles.skuInput}
                  placeholder="Enter SKU"
                  value={formData.sku}
                  onChangeText={text => setFormData({ ...formData, sku: text })}
                />
                <TouchableOpacity style={styles.imagePickerSquare} onPress={handlePickImage}>
                  {formData.imageUri ? (
                    <Image source={{ uri: formData.imageUri }} style={styles.previewImageSquare} />
                  ) : (
                    <View style={styles.imagePlaceholderSquare}>
                      <Text style={styles.imagePlaceholderText}>Image</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Price *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter price"
                value={formData.price}
                onChangeText={text => setFormData({ ...formData, price: text })}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Category *</Text>
              <CategoryDropdownProduct
                categories={categories}
                selectedCategory={formData.category}
                onSelectCategory={name => setFormData({ ...formData, category: name })}
                placeholder="Select category"
              />
              <View style={styles.newCategoryRow}>
                <TextInput
                  style={styles.newCategoryInput}
                  placeholder="New category name"
                  placeholderTextColor={colors.textSecondary}
                  value={newCategoryName}
                  onChangeText={setNewCategoryName}
                />
                <TouchableOpacity style={styles.addCategoryButton} onPress={handleAddNewCategory}>
                  <Text style={styles.addCategoryButtonText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Tax (%)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter tax percentage"
                value={formData.tax}
                onChangeText={text => setFormData({ ...formData, tax: text })}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.activeRow}>
              <Text style={styles.label}>Active</Text>
              <Switch
                value={formData.isActive}
                onValueChange={value => setFormData({ ...formData, isActive: value })}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.surface}
              />
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveProduct}>
              <Text style={styles.saveButtonText}>Save Product</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Reports Modal */}
      <Modal
        visible={isReportsVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setIsReportsVisible(false)}
      >
        <View style={styles.reportsModalContainer}>
          <View style={styles.reportsModalHeader}>
            <Text style={styles.reportsModalTitle}>Sales Reports</Text>
            <TouchableOpacity onPress={() => setIsReportsVisible(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
          <ReportsScreen />
        </View>
      </Modal>
      </View>
    </ProtectedRoute>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerActionButton: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  headerActionButtonText: {
    ...typography.button,
    color: colors.surface,
    fontSize: 14,
  },
  reportsModalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  reportsModalHeader: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reportsModalTitle: {
    ...typography.h1,
    color: colors.text,
  },
  closeButtonText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  listContent: {
    padding: spacing.md,
  },
  productRow: {
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  productCard: {
    flex: 1,
    minWidth: 0,
    maxWidth: '48%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImageContainer: {
    width: '100%',
    height: 100,
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
    borderRadius: 0,
  },
  placeholderImage: {
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  productActionsOverImage: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  actionIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: colors.primary,
  },
  deleteButton: {
    backgroundColor: colors.error,
  },
  actionIconText: {
    fontSize: 18,
    color: colors.surface,
  },
  productInfo: {
    padding: spacing.sm,
  },
  productName: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  productSku: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  productPrice: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  productCategory: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  productTax: {
    ...typography.caption,
    color: colors.textSecondary,
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
  modalCloseButton: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: spacing.lg,
  },
  modalScrollContent: {
    paddingBottom: 100,
  },
  skuImageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  skuInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    ...typography.body,
    color: colors.text,
    minHeight: 48,
  },
  imagePickerSquare: {
    width: 96,
    height: 96,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.border,
  },
  previewImageSquare: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholderSquare: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  formGroup: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.bodySmall,
    color: colors.text,
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...typography.body,
    color: colors.text,
    minHeight: 48,
  },
  newCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  newCategoryInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    ...typography.bodySmall,
    color: colors.text,
    minHeight: 44,
  },
  addCategoryButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  addCategoryButtonText: {
    ...typography.bodySmall,
    color: colors.surface,
    fontWeight: '600',
  },
  activeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  saveButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  saveButtonText: {
    ...typography.button,
    color: colors.surface,
  },
});

export default ProductScreen;

