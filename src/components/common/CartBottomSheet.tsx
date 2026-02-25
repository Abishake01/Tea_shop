import React from 'react';
import { Modal, View, Pressable, StyleSheet } from 'react-native';
import { colors, spacing } from '../../theme';
import CartPanel from './CartPanel';

interface CartBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

const CartBottomSheet: React.FC<CartBottomSheetProps> = ({ visible, onClose, onCheckout }) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <CartPanel onCheckout={onCheckout} />
      </View>
    </Modal>
  );
};

const TAB_BAR_HEIGHT = 0; // Match BottomTabNavigator tabBarStyle.height

const styles = StyleSheet.create({
  backdrop: {
    flex:1,
    backgroundColor: 'rgba(131, 126, 126, 0.35)',
    
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: TAB_BAR_HEIGHT,
    height: '70%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  handle: {
    alignSelf: 'center',
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border,
    marginBottom: spacing.sm,
  },
});

export default CartBottomSheet;
