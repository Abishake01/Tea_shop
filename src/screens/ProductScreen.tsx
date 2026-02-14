import React, { useState } from 'react';
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
} from 'react-native';
import { useProducts } from '../context/ProductContext';
import { Product } from '../types';
import { colors, spacing, typography } from '../theme';
import { imageService } from '../services/imageService';
import { validatePrice, validateTax, validateRequired, validateSKU } from '../utils/validators';
import { formatCurrency } from '../utils/formatters';
import ReportsScreen from './ReportsScreen';

const ProductScreen: React.FC = () => {
  const { products, categories, addProduct, updateProduct, deleteProduct } = useProducts();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isReportsVisible, setIsReportsVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: categories[0]?.name || '',
    sku: '',
    tax: '0',
    isActive: true,
    imageUri: '',
  });

  const handleAddProduct = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      price: '',
      category: categories[0]?.name || '',
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
      {item.imageUri ? (
        <Image source={{ uri: item.imageUri }} style={styles.productImage} />
      ) : (
        <View style={[styles.productImage, styles.placeholderImage]}>
          <Text style={styles.placeholderText}>No Image</Text>
        </View>
      )}
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productSku}>SKU: {item.sku}</Text>
        <Text style={styles.productPrice}>{formatCurrency(item.price)}</Text>
        <Text style={styles.productCategory}>Category: {item.category}</Text>
        <Text style={styles.productTax}>Tax: {item.tax}%</Text>
        <View style={styles.productActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => handleEditProduct(item)}
          >
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteProduct(item)}
          >
            <Text style={styles.actionButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Products</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={[styles.headerButton, styles.reportsButton]}
            onPress={() => setIsReportsVisible(true)}
          >
            <Text style={styles.reportsButtonText}>Reports</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addButton} onPress={handleAddProduct}>
            <Text style={styles.addButtonText}>+ Add Product</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={products}
        renderItem={renderProductItem}
        keyExtractor={item => item.id}
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
              <Text style={styles.closeButton}>Close</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <TouchableOpacity style={styles.imagePicker} onPress={handlePickImage}>
              {formData.imageUri ? (
                <Image source={{ uri: formData.imageUri }} style={styles.previewImage} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Text style={styles.imagePlaceholderText}>Tap to add image</Text>
                </View>
              )}
            </TouchableOpacity>

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
              <TextInput
                style={styles.input}
                placeholder="Enter SKU"
                value={formData.sku}
                onChangeText={text => setFormData({ ...formData, sku: text })}
              />
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
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {categories.map(cat => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryChip,
                      formData.category === cat.name && styles.categoryChipActive,
                    ]}
                    onPress={() => setFormData({ ...formData, category: cat.name })}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        formData.category === cat.name && styles.categoryChipTextActive,
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
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

            <TouchableOpacity
              style={[
                styles.toggleButton,
                formData.isActive && styles.toggleButtonActive,
              ]}
              onPress={() => setFormData({ ...formData, isActive: !formData.isActive })}
            >
              <Text
                style={[
                  styles.toggleButtonText,
                  formData.isActive && styles.toggleButtonTextActive,
                ]}
              >
                {formData.isActive ? 'Active' : 'Inactive'}
              </Text>
            </TouchableOpacity>

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
              <Text style={styles.closeButton}>Close</Text>
            </TouchableOpacity>
          </View>
          <ReportsScreen />
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
  headerButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  reportsButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  reportsButtonText: {
    ...typography.button,
    color: colors.surface,
  },
  addButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  addButtonText: {
    ...typography.button,
    color: colors.surface,
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
  closeButton: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  listContent: {
    padding: spacing.md,
  },
  productCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: spacing.md,
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
  productInfo: {
    flex: 1,
  },
  productName: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  productSku: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  productPrice: {
    ...typography.body,
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
    marginBottom: spacing.sm,
  },
  productActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 6,
  },
  editButton: {
    backgroundColor: colors.primary,
  },
  deleteButton: {
    backgroundColor: colors.error,
  },
  actionButtonText: {
    ...typography.caption,
    color: colors.surface,
    fontWeight: '600',
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
  closeButton: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: spacing.lg,
  },
  imagePicker: {
    width: '100%',
    height: 200,
    marginBottom: spacing.lg,
    borderRadius: 12,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    ...typography.body,
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
  categoryChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.border,
    marginRight: spacing.sm,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
  },
  categoryChipText: {
    ...typography.bodySmall,
    color: colors.text,
  },
  categoryChipTextActive: {
    color: colors.surface,
  },
  toggleButton: {
    backgroundColor: colors.border,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  toggleButtonActive: {
    backgroundColor: colors.success,
  },
  toggleButtonText: {
    ...typography.button,
    color: colors.text,
  },
  toggleButtonTextActive: {
    color: colors.surface,
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

