import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { orderService } from '../services/orderService';
import { SalesReport } from '../types';
import { colors, spacing, typography } from '../theme';
import { formatCurrency, formatDate } from '../utils/formatters';

const ReportsScreen: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [report, setReport] = useState<SalesReport | null>(null);

  useEffect(() => {
    loadReport();
  }, [selectedPeriod]);

  const loadReport = () => {
    const now = Date.now();
    let startDate: number;

    switch (selectedPeriod) {
      case 'today':
        startDate = new Date().setHours(0, 0, 0, 0);
        break;
      case 'week':
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        startDate = weekAgo.getTime();
        break;
      case 'month':
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        startDate = monthAgo.getTime();
        break;
      default:
        startDate = new Date().setHours(0, 0, 0, 0);
    }

    const salesReport = orderService.getSalesReport(startDate, now);
    setReport(salesReport);
  };

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case 'today':
        return 'Today';
      case 'week':
        return 'Last 7 Days';
      case 'month':
        return 'Last 30 Days';
      default:
        return 'Today';
    }
  };

  if (!report) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>

      {/* Period Selector */}
      <View style={styles.periodContainer}>
        {(['today', 'week', 'month'] as const).map(period => (
          <TouchableOpacity
            key={period}
            style={[
              styles.periodButton,
              selectedPeriod === period && styles.periodButtonActive,
            ]}
            onPress={() => setSelectedPeriod(period)}
          >
            <Text
              style={[
                styles.periodButtonText,
                selectedPeriod === period && styles.periodButtonTextActive,
              ]}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Sales</Text>
          <Text style={styles.summaryValue}>{formatCurrency(report.totalSales)}</Text>
          <Text style={styles.summaryPeriod}>{getPeriodLabel()}</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Orders</Text>
          <Text style={styles.summaryValue}>{report.totalOrders}</Text>
          <Text style={styles.summaryPeriod}>{getPeriodLabel()}</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Average Order</Text>
          <Text style={styles.summaryValue}>
            {formatCurrency(report.averageOrderValue)}
          </Text>
          <Text style={styles.summaryPeriod}>{getPeriodLabel()}</Text>
        </View>
      </View>

      {/* Top Products */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Top Selling Products</Text>
        {report.topProducts.length > 0 ? (
          <View style={styles.topProductsList}>
            {report.topProducts.map((product, index) => (
              <View key={product.productId} style={styles.productRow}>
                <View style={styles.productRank}>
                  <Text style={styles.rankText}>#{index + 1}</Text>
                </View>
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{product.productName}</Text>
                  <Text style={styles.productDetails}>
                    {product.quantity} sold • {formatCurrency(product.revenue)}
                  </Text>
                </View>
                <View style={styles.productRevenue}>
                  <Text style={styles.revenueText}>{formatCurrency(product.revenue)}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No sales data for this period</Text>
          </View>
        )}
      </View>

      {/* Date Range Info */}
      <View style={styles.dateRangeContainer}>
        <Text style={styles.dateRangeLabel}>Report Period:</Text>
        <Text style={styles.dateRangeText}>
          {formatDate(report.dateRange.start)} - {formatDate(report.dateRange.end)}
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    paddingBottom: spacing.xl,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  periodContainer: {
    flexDirection: 'row',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  periodButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 8,
    backgroundColor: colors.border,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: colors.primary,
  },
  periodButtonText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500',
  },
  periodButtonTextActive: {
    color: colors.surface,
    fontWeight: '600',
  },
  summaryContainer: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  summaryValue: {
    ...typography.h2,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  summaryPeriod: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 10,
  },
  section: {
    padding: spacing.lg,
  },
  sectionTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.md,
  },
  topProductsList: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
  },
  productRow: {
    flexDirection: 'row',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: 'center',
  },
  productRank: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  rankText: {
    ...typography.body,
    color: colors.surface,
    fontWeight: '700',
  },
  productInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  productName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  productDetails: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  productRevenue: {
    alignItems: 'flex-end',
  },
  revenueText: {
    ...typography.h3,
    color: colors.primary,
  },
  emptyState: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  dateRangeContainer: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    margin: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  dateRangeLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  dateRangeText: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '500',
  },
});

export default ReportsScreen;

