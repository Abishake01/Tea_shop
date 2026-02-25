import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, Platform, StatusBar } from 'react-native';
import { colors, spacing, typography } from '../../theme';

interface ScreenHeaderProps {
  /** Title shown in the header (e.g. shop name, "Billing", "Product") */
  title: string;
  /** Optional right-side content (e.g. buttons) */
  rightElement?: ReactNode;
  /** Optional extra height. */
  height?: number;
}

const DEFAULT_HEADER_HEIGHT = 80;
const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 0;

const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  rightElement,
  height = DEFAULT_HEADER_HEIGHT,
}) => {
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
    >
      <View style={styles.inner}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {rightElement ? <View style={styles.right}>{rightElement}</View> : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    width: '100%',
    backgroundColor: colors.primary,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    justifyContent: 'flex-end',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    flex: 1,
  },
  title: {
    ...typography.h1,
    fontSize: 20,
    color: colors.surface,
    flex: 1,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});

export default ScreenHeader;
