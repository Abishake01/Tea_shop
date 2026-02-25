import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../../theme';

interface ScreenHeaderProps {
  /** Optional extra height. Default gives a compact bar. */
  height?: number;
}

const DEFAULT_HEADER_HEIGHT = 32;

const ScreenHeader: React.FC<ScreenHeaderProps> = ({ height = DEFAULT_HEADER_HEIGHT }) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.header,
        {
          paddingTop: insets.top,
          height: (height || DEFAULT_HEADER_HEIGHT) + insets.top,
        },
      ]}
    />
  );
};

const styles = StyleSheet.create({
  header: {
    width: '100%',
    backgroundColor: colors.primary,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
});

export default ScreenHeader;
