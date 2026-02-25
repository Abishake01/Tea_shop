import React from 'react';
import { View, StyleSheet, Platform, StatusBar } from 'react-native';
import { colors } from '../../theme';

interface ScreenHeaderProps {
  /** Optional extra height. Default gives a compact bar. */
  height?: number;
}

const DEFAULT_HEADER_HEIGHT = 72;
const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 0;

const ScreenHeader: React.FC<ScreenHeaderProps> = ({ height = DEFAULT_HEADER_HEIGHT }) => {
  const top = Platform.OS === 'ios' ? 20 : STATUS_BAR_HEIGHT;

  return (
    <View
      style={[
        styles.header,
        {
          paddingTop: top,
          height: (height || DEFAULT_HEADER_HEIGHT) + top,
        },
      ]}
    />
  );
};

const styles = StyleSheet.create({
  header: {
    width: '100%',
    backgroundColor: colors.primary,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
});

export default ScreenHeader;
