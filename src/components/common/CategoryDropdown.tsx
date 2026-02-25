import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  Pressable,
} from 'react-native';
import { Category } from '../../types';
import { colors, spacing, typography } from '../../theme';
import { Storage, StorageKeys } from '../../services/storage';

const RECENT_MAX = 5;

interface CategoryDropdownFilterProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

interface CategoryDropdownProductProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  placeholder?: string;
}

export const CategoryDropdownFilter: React.FC<CategoryDropdownFilterProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    const stored = Storage.getArray<string>(StorageKeys.RECENT_CATEGORIES);
    setRecent(stored.slice(0, RECENT_MAX));
  }, [modalVisible]);

  const displayLabel = selectedCategory === 'all' ? 'All' : selectedCategory;

  const addToRecent = (name: string) => {
    if (name === 'all') return;
    const stored = Storage.getArray<string>(StorageKeys.RECENT_CATEGORIES);
    const next = [name, ...stored.filter(c => c !== name)].slice(0, RECENT_MAX);
    Storage.setArray(StorageKeys.RECENT_CATEGORIES, next);
    setRecent(next);
  };

  const handleSelect = (name: string) => {
    onSelectCategory(name);
    addToRecent(name);
    setModalVisible(false);
    setShowAllCategories(false);
  };

  const recentCategories = recent
    .map(name => categories.find(c => c.name === name))
    .filter((c): c is Category => c != null);
  const hasMore = categories.length > recentCategories.length;

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        style={styles.trigger}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.triggerText}>{displayLabel}</Text>
        <Text style={styles.triggerArrow}>▼</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setModalVisible(false)}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Category</Text>

            <TouchableOpacity
              style={[styles.option, selectedCategory === 'all' && styles.optionSelected]}
              onPress={() => handleSelect('all')}
            >
              <Text style={[styles.optionText, selectedCategory === 'all' && styles.optionTextSelected]}>All</Text>
            </TouchableOpacity>

            {!showAllCategories ? (
              <>
                {recentCategories.map(cat => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.option, selectedCategory === cat.name && styles.optionSelected]}
                    onPress={() => handleSelect(cat.name)}
                  >
                    <Text style={[styles.optionText, selectedCategory === cat.name && styles.optionTextSelected]}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
                {hasMore && (
                  <TouchableOpacity
                    style={styles.optionMore}
                    onPress={() => setShowAllCategories(true)}
                  >
                    <Text style={styles.optionMoreText}>More... ({categories.length} total)</Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <FlatList
                data={categories}
                keyExtractor={item => item.id}
                style={styles.list}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.option, selectedCategory === item.name && styles.optionSelected]}
                    onPress={() => handleSelect(item.name)}
                  >
                    <Text style={[styles.optionText, selectedCategory === item.name && styles.optionTextSelected]}>
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                )}
                ListFooterComponent={
                  <TouchableOpacity
                    style={styles.optionMore}
                    onPress={() => setShowAllCategories(false)}
                  >
                    <Text style={styles.optionMoreText}>← Back to recent</Text>
                  </TouchableOpacity>
                }
              />
            )}

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

export const CategoryDropdownProduct: React.FC<CategoryDropdownProductProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  placeholder = 'Select category',
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  const displayLabel = selectedCategory || placeholder;

  const handleSelect = (name: string) => {
    onSelectCategory(name);
    setModalVisible(false);
  };

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        style={styles.trigger}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={[styles.triggerText, !selectedCategory && styles.triggerPlaceholder]}>
          {displayLabel}
        </Text>
        <Text style={styles.triggerArrow}>▼</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setModalVisible(false)}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Select category</Text>
            <FlatList
              data={categories}
              keyExtractor={item => item.id}
              style={styles.list}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.option, selectedCategory === item.name && styles.optionSelected]}
                  onPress={() => handleSelect(item.name)}
                >
                  <Text style={[styles.optionText, selectedCategory === item.name && styles.optionTextSelected]}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    minWidth: 120,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 48,
  },
  triggerText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  triggerPlaceholder: {
    color: colors.textSecondary,
  },
  triggerArrow: {
    fontSize: 10,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalBox: {
    width: '100%',
    maxWidth: 320,
    maxHeight: '70%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  option: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.xs,
  },
  optionSelected: {
    backgroundColor: colors.primary,
  },
  optionText: {
    ...typography.body,
    color: colors.text,
  },
  optionTextSelected: {
    color: colors.surface,
  },
  optionMore: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  optionMoreText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  list: {
    maxHeight: 280,
  },
  cancelBtn: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  cancelBtnText: {
    ...typography.body,
    color: colors.textSecondary,
  },
});

export default CategoryDropdownFilter;
