import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { colors, spacing, typography } from '../../theme';

interface FloatingCartButtonProps {
  itemCount: number;
  onPress: () => void;
}

const FloatingCartButton: React.FC<FloatingCartButtonProps> = ({ itemCount, onPress }) => {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (itemCount > 0) {
      Animated.sequence([
        Animated.spring(pulse, {
          toValue: 1,
          useNativeDriver: true,
          speed: 18,
          bounciness: 8,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 120,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [itemCount, pulse]);

  const scale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.12],
  });

  const rotate = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-10deg'],
  });

  return (
    <View pointerEvents="box-none" style={styles.container}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
        <Animated.View style={[styles.button, { transform: [{ scale }, { rotate }] }]}>
          <Text style={styles.icon}>🛒</Text>
          {itemCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{itemCount}</Text>
            </View>
          )}
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 76,
    alignItems: 'center',
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
  },
  icon: {
    fontSize: 26,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 4,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    ...typography.caption,
    color: colors.surface,
    fontWeight: '700',
    fontSize: 11,
  },
});

export default FloatingCartButton;
