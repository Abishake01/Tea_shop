import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Product } from '../../types';
import { colors, spacing, typography } from '../../theme';
import { formatCurrency } from '../../utils/formatters';

interface ProductCardProps {
  product: Product;
  onPress: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onPress }) => {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(product)}
      activeOpacity={0.7}
    >
      {product.imageUri ? (
        <Image source={{ uri: product.imageUri }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.placeholder]}>
          <Text style={styles.placeholderText}>No Image</Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={styles.price}>{formatCurrency(product.price)}</Text>
        {product.tax > 0 && (
          <Text style={styles.tax}>+{product.tax}% tax</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: spacing.xs,
    marginBottom: spacing.sm,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: 96,
    backgroundColor: colors.border,
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  info: {
    padding: spacing.sm,
  },
  name: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
    minHeight: 32,
  },
  price: {
    ...typography.bodySmall,
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 0,
  },
  tax: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;

