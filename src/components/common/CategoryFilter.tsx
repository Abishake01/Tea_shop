import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Category } from '../../types';
import { colors, spacing, typography } from '../../theme';

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
}) => {
  const allCategory = { id: 'all', name: 'All', color: colors.textSecondary };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <TouchableOpacity
          style={[
            styles.chip,
            selectedCategory === 'all' && styles.chipActive,
            selectedCategory === 'all' && { backgroundColor: colors.primary },
          ]}
          onPress={() => onSelectCategory('all')}
        >
          <Text
            style={[
              styles.chipText,
              selectedCategory === 'all' && styles.chipTextActive,
            ]}
          >
            {allCategory.name}
          </Text>
        </TouchableOpacity>
        {categories.map(category => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.chip,
              selectedCategory === category.name && styles.chipActive,
              selectedCategory === category.name && { backgroundColor: category.color },
            ]}
            onPress={() => onSelectCategory(category.name)}
          >
            <Text
              style={[
                styles.chipText,
                selectedCategory === category.name && styles.chipTextActive,
              ]}
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.border,
    marginRight: spacing.sm,
  },
  chipActive: {
    // backgroundColor set dynamically
  },
  chipText: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '500',
  },
  chipTextActive: {
    color: colors.surface,
    fontWeight: '600',
  },
});

export default CategoryFilter;

