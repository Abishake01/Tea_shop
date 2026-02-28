import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Category } from '../../types';
import { colors, spacing, typography } from '../../theme';

interface CategorySliderProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export const CategorySlider: React.FC<CategorySliderProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      style={styles.scroll}
    >
      <TouchableOpacity
        style={[styles.chip, selectedCategory === 'all' && styles.chipActive]}
        onPress={() => onSelectCategory('all')}
      >
        <Text style={[styles.chipText, selectedCategory === 'all' && styles.chipTextActive]}>
          All
        </Text>
      </TouchableOpacity>
      {categories.map(cat => (
        <TouchableOpacity
          key={cat.id}
          style={[styles.chip, selectedCategory === cat.name && styles.chipActive]}
          onPress={() => onSelectCategory(cat.name)}
        >
          <Text style={[styles.chipText, selectedCategory === cat.name && styles.chipTextActive]}>
            {cat.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '600',
  },
  chipTextActive: {
    color: colors.surface,
  },
});

export default CategorySlider;
