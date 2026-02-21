import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  FlatList,
  Switch,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/userService';
import { settingsService } from '../services/settingsService';
import { User, Settings, SalesReport } from '../types';
import { colors, spacing, typography } from '../theme';
import { reportService } from '../services/reportService';
import { formatCurrency, formatDate } from '../utils/formatters';
import { printService } from '../services/printService';

const ProfileScreen: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();
  const [settings, setSettings] = useState<Settings>(settingsService.getSettings());
  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);
  const [isChangePasswordModalVisible, setIsChangePasswordModalVisible] = useState(false);
  const [isUserManagementVisible, setIsUserManagementVisible] = useState(false);
  const [isAddStaffModalVisible, setIsAddStaffModalVisible] = useState(false);
  const [isReportsVisible, setIsReportsVisible] = useState(false);
  const [reportTab, setReportTab] = useState<'billing' | 'token'>('billing');
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [report, setReport] = useState<SalesReport | null>(null);
  const [isPrinterVisible, setIsPrinterVisible] = useState(false);
  const [printers, setPrinters] = useState<Array<{ name: string; address: string }>>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedPrinter, setSelectedPrinter] = useState<string | undefined>(
    printService.getSelectedPrinter()
  );
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [staffUsers, setStaffUsers] = useState<User[]>([]);
  const [newStaffData, setNewStaffData] = useState({
    username: '',
    name: '',
    password: '',
  });

  useEffect(() => {
    if (isAdmin) {
      loadStaffUsers();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!isReportsVisible) return;
    loadReport();
  }, [isReportsVisible, reportTab, selectedPeriod]);

  useEffect(() => {
    if (!isPrinterVisible) return;
    refreshPrinters();
  }, [isPrinterVisible]);

  const getReportRange = () => {
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

    return { startDate, endDate: now };
  };

  const loadReport = () => {
    const { startDate, endDate } = getReportRange();
    const nextReport = reportService.getReport(reportTab, startDate, endDate);
    setReport(nextReport);
  };

  const handleExportCsv = async () => {
    try {
      const { startDate, endDate } = getReportRange();
      await reportService.exportCsv(reportTab, startDate, endDate);
      Alert.alert('Export Complete', 'CSV report saved and ready to share.');
    } catch (error) {
      Alert.alert('Export Failed', 'Unable to export CSV report.');
    }
  };

  const refreshPrinters = async () => {
    setIsScanning(true);
    try {
      const list = await printService.listPrinters();
      setPrinters(list);
      setSelectedPrinter(printService.getSelectedPrinter());
    } catch {
      Alert.alert('Printer Scan Failed', 'Unable to scan Bluetooth printers.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleConnectPrinter = async (address: string) => {
    const connected = await printService.connectPrinter(address);
    if (connected) {
      setSelectedPrinter(address);
      Alert.alert('Printer Connected', 'MTP-II connected successfully.');
    } else {
      Alert.alert('Connection Failed', 'Unable to connect to printer.');
    }
  };

  const handleTestPrint = async () => {
    const result = await printService.printTest();
    if (!result.success && result.message) {
      Alert.alert('Print Failed', result.message);
    }
  };

  const loadStaffUsers = () => {
    const allUsers = userService.getAllUsers();
    const staff = allUsers.filter(u => u.role === 'staff');
    setStaffUsers(staff);
  };

  const handleUpdateSettings = () => {
    settingsService.updateSettings(settings);
    setIsSettingsModalVisible(false);
    Alert.alert('Success', 'Settings updated successfully');
  };

  const handleChangePassword = () => {
    if (!user) return;

    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    // Verify current password
    const currentUser = userService.getUserById(user.id);
    if (!currentUser) {
      Alert.alert('Error', 'User not found');
      return;
    }

    const { hashPassword, verifyPassword } = require('../services/userService');
    if (!verifyPassword(passwordData.currentPassword, currentUser.password)) {
      Alert.alert('Error', 'Current password is incorrect');
      return;
    }

    // Update password
    const hashedPassword = hashPassword(passwordData.newPassword);
    userService.updateUser(user.id, { password: hashedPassword });

    setIsChangePasswordModalVisible(false);
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    Alert.alert('Success', 'Password changed successfully');
  };

  const handleAddStaff = () => {
    setNewStaffData({ username: '', name: '', password: '' });
    setIsAddStaffModalVisible(true);
  };

  const handleSaveStaff = () => {
    if (!newStaffData.username.trim()) {
      Alert.alert('Error', 'Username is required');
      return;
    }
    if (!newStaffData.name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }
    if (!newStaffData.password || newStaffData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    // Check if username already exists
    const existingUser = userService.getUserByUsername(newStaffData.username.trim());
    if (existingUser) {
      Alert.alert('Error', 'Username already exists');
      return;
    }

    const { hashPassword } = require('../services/userService');
    userService.createUser({
      username: newStaffData.username.trim(),
      password: hashPassword(newStaffData.password),
      name: newStaffData.name.trim(),
      role: 'staff',
    });

    loadStaffUsers();
    setIsAddStaffModalVisible(false);
    setNewStaffData({ username: '', name: '', password: '' });
    Alert.alert('Success', 'Staff user created successfully');
  };

  const handleDeleteStaff = (staffUser: User) => {
    Alert.alert(
      'Delete Staff User',
      `Are you sure you want to delete "${staffUser.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            userService.deleteUser(staffUser.id);
            loadStaffUsers();
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.role}>{user?.role?.toUpperCase()}</Text>
          <Text style={styles.username}>@{user?.username}</Text>
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setIsSettingsModalVisible(true)}
          >
            <Text style={styles.menuItemText}>Settings</Text>
            <Text style={styles.menuItemArrow}>›</Text>
          </TouchableOpacity>

          {isAdmin && (
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => setIsReportsVisible(true)}
            >
              <Text style={styles.menuItemText}>Reports</Text>
              <Text style={styles.menuItemArrow}>›</Text>
            </TouchableOpacity>
          )}

          {isAdmin && (
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => setIsPrinterVisible(true)}
            >
              <Text style={styles.menuItemText}>Printer Setup</Text>
              <Text style={styles.menuItemArrow}>›</Text>
            </TouchableOpacity>
          )}

          {isAdmin && (
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => setIsChangePasswordModalVisible(true)}
            >
              <Text style={styles.menuItemText}>Change Password</Text>
              <Text style={styles.menuItemArrow}>›</Text>
            </TouchableOpacity>
          )}

          {isAdmin && (
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => setIsUserManagementVisible(true)}
            >
              <Text style={styles.menuItemText}>Manage Staff Users</Text>
              <Text style={styles.menuItemArrow}>›</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Settings Modal */}
      <Modal
        visible={isSettingsModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsSettingsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Settings</Text>
            <TouchableOpacity onPress={() => setIsSettingsModalVisible(false)}>
              <Text style={styles.closeButton}>Close</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Shop Name</Text>
              <TextInput
                style={styles.input}
                value={settings.shopName}
                onChangeText={text => setSettings({ ...settings, shopName: text })}
                placeholder="Enter shop name"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Currency</Text>
              <TextInput
                style={styles.input}
                value={settings.currency}
                onChangeText={text => setSettings({ ...settings, currency: text.toUpperCase() })}
                placeholder="USD"
                maxLength={3}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Default Tax Rate (%)</Text>
              <TextInput
                style={styles.input}
                value={settings.defaultTaxRate.toString()}
                onChangeText={text => {
                  const rate = parseFloat(text) || 0;
                  setSettings({ ...settings, defaultTaxRate: rate });
                }}
                placeholder="0"
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.formGroupRow}>
              <View>
                <Text style={styles.label}>Auto print after checkout</Text>
                <Text style={styles.helperText}>Shows preview and prints automatically</Text>
              </View>
              <Switch
                value={settings.autoPrintAfterCheckout}
                onValueChange={value =>
                  setSettings({ ...settings, autoPrintAfterCheckout: value })
                }
              />
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleUpdateSettings}>
              <Text style={styles.saveButtonText}>Save Settings</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        visible={isChangePasswordModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsChangePasswordModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Change Password</Text>
            <TouchableOpacity onPress={() => setIsChangePasswordModalVisible(false)}>
              <Text style={styles.closeButton}>Close</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Current Password</Text>
              <TextInput
                style={styles.input}
                value={passwordData.currentPassword}
                onChangeText={text => setPasswordData({ ...passwordData, currentPassword: text })}
                placeholder="Enter current password"
                secureTextEntry
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>New Password</Text>
              <TextInput
                style={styles.input}
                value={passwordData.newPassword}
                onChangeText={text => setPasswordData({ ...passwordData, newPassword: text })}
                placeholder="Enter new password"
                secureTextEntry
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Confirm New Password</Text>
              <TextInput
                style={styles.input}
                value={passwordData.confirmPassword}
                onChangeText={text => setPasswordData({ ...passwordData, confirmPassword: text })}
                placeholder="Confirm new password"
                secureTextEntry
              />
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleChangePassword}>
              <Text style={styles.saveButtonText}>Change Password</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* User Management Modal */}
      <Modal
        visible={isUserManagementVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsUserManagementVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Manage Staff Users</Text>
            <TouchableOpacity onPress={() => setIsUserManagementVisible(false)}>
              <Text style={styles.closeButton}>Close</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.addButton} onPress={handleAddStaff}>
              <Text style={styles.addButtonText}>+ Add Staff User</Text>
            </TouchableOpacity>

            <FlatList
              data={staffUsers}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <View style={styles.userCard}>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{item.name}</Text>
                    <Text style={styles.userUsername}>@{item.username}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteUserButton}
                    onPress={() => handleDeleteStaff(item)}
                  >
                    <Text style={styles.deleteUserButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              )}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No staff users yet</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>

      {/* Add Staff Modal */}
      <Modal
        visible={isAddStaffModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsAddStaffModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Staff User</Text>
            <TouchableOpacity onPress={() => setIsAddStaffModalVisible(false)}>
              <Text style={styles.closeButton}>Close</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Username *</Text>
              <TextInput
                style={styles.input}
                value={newStaffData.username}
                onChangeText={text => setNewStaffData({ ...newStaffData, username: text })}
                placeholder="Enter username"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Name *</Text>
              <TextInput
                style={styles.input}
                value={newStaffData.name}
                onChangeText={text => setNewStaffData({ ...newStaffData, name: text })}
                placeholder="Enter full name"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Password *</Text>
              <TextInput
                style={styles.input}
                value={newStaffData.password}
                onChangeText={text => setNewStaffData({ ...newStaffData, password: text })}
                placeholder="Enter password (min 6 characters)"
                secureTextEntry
              />
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveStaff}>
              <Text style={styles.saveButtonText}>Create Staff User</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Reports Modal */}
      <Modal
        visible={isReportsVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsReportsVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Reports</Text>
            <TouchableOpacity onPress={() => setIsReportsVisible(false)}>
              <Text style={styles.closeButton}>Close</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.reportsTabContainer}>
            <TouchableOpacity
              style={[
                styles.reportsTab,
                reportTab === 'billing' && styles.reportsTabActive,
              ]}
              onPress={() => setReportTab('billing')}
            >
              <Text
                style={[
                  styles.reportsTabText,
                  reportTab === 'billing' && styles.reportsTabTextActive,
                ]}
              >
                Billing
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.reportsTab,
                reportTab === 'token' && styles.reportsTabActive,
              ]}
              onPress={() => setReportTab('token')}
            >
              <Text
                style={[
                  styles.reportsTabText,
                  reportTab === 'token' && styles.reportsTabTextActive,
                ]}
              >
                Token
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.reportsPeriodContainer}>
            {(['today', 'week', 'month'] as const).map(period => (
              <TouchableOpacity
                key={period}
                style={[
                  styles.reportsPeriodButton,
                  selectedPeriod === period && styles.reportsPeriodButtonActive,
                ]}
                onPress={() => setSelectedPeriod(period)}
              >
                <Text
                  style={[
                    styles.reportsPeriodText,
                    selectedPeriod === period && styles.reportsPeriodTextActive,
                  ]}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView style={styles.modalContent}>
            {report ? (
              <>
                <View style={styles.reportsSummaryContainer}>
                  <View style={styles.reportsSummaryCard}>
                    <Text style={styles.reportsSummaryLabel}>Total Sales</Text>
                    <Text style={styles.reportsSummaryValue}>
                      {formatCurrency(report.totalSales)}
                    </Text>
                  </View>
                  <View style={styles.reportsSummaryCard}>
                    <Text style={styles.reportsSummaryLabel}>Total Orders</Text>
                    <Text style={styles.reportsSummaryValue}>{report.totalOrders}</Text>
                  </View>
                </View>

                <View style={styles.reportsSummaryContainer}>
                  <View style={styles.reportsSummaryCard}>
                    <Text style={styles.reportsSummaryLabel}>Average Order</Text>
                    <Text style={styles.reportsSummaryValue}>
                      {formatCurrency(report.averageOrderValue)}
                    </Text>
                  </View>
                  <View style={styles.reportsSummaryCard}>
                    <Text style={styles.reportsSummaryLabel}>Date Range</Text>
                    <Text style={styles.reportsSummaryValueSmall}>
                      {formatDate(report.dateRange.start)}
                    </Text>
                    <Text style={styles.reportsSummaryValueSmall}>
                      {formatDate(report.dateRange.end)}
                    </Text>
                  </View>
                </View>

                <View style={styles.reportsSection}>
                  <Text style={styles.reportsSectionTitle}>Top Products</Text>
                  {report.topProducts.length > 0 ? (
                    report.topProducts.map(product => (
                      <View key={product.productId} style={styles.reportsProductRow}>
                        <View style={styles.reportsProductInfo}>
                          <Text style={styles.reportsProductName}>{product.productName}</Text>
                          <Text style={styles.reportsProductDetails}>
                            {product.quantity} sold
                          </Text>
                        </View>
                        <Text style={styles.reportsProductRevenue}>
                          {formatCurrency(product.revenue)}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>No sales data for this period</Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity style={styles.exportButton} onPress={handleExportCsv}>
                  <Text style={styles.exportButtonText}>Download CSV</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Loading report...</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Printer Setup Modal */}
      <Modal
        visible={isPrinterVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsPrinterVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Printer Setup</Text>
            <TouchableOpacity onPress={() => setIsPrinterVisible(false)}>
              <Text style={styles.closeButton}>Close</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.printerActions}>
            <TouchableOpacity style={styles.scanButton} onPress={refreshPrinters}>
              <Text style={styles.scanButtonText}>
                {isScanning ? 'Scanning...' : 'Scan Printers'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.testButton} onPress={handleTestPrint}>
              <Text style={styles.testButtonText}>Test Print</Text>
            </TouchableOpacity>
          </View>

          {!printService.isPrinterSupported() && (
            <View style={styles.printerNote}>
              <Text style={styles.printerNoteText}>
                Printer setup requires a custom dev build. Expo Go cannot access Bluetooth SPP.
              </Text>
            </View>
          )}

          <ScrollView style={styles.modalContent}>
            {printers.length > 0 ? (
              printers.map(device => (
                <TouchableOpacity
                  key={device.address}
                  style={styles.printerRow}
                  onPress={() => handleConnectPrinter(device.address)}
                >
                  <View style={styles.printerInfo}>
                    <Text style={styles.printerName}>{device.name}</Text>
                    <Text style={styles.printerAddress}>{device.address}</Text>
                  </View>
                  {selectedPrinter === device.address ? (
                    <Text style={styles.printerStatus}>Connected</Text>
                  ) : (
                    <Text style={styles.printerStatusInactive}>Tap to connect</Text>
                  )}
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No printers found</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...typography.h1,
    color: colors.text,
  },
  content: {
    padding: spacing.lg,
  },
  profileCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    ...typography.h1,
    color: colors.surface,
    fontSize: 32,
  },
  name: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  role: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  username: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  section: {
    gap: spacing.sm,
  },
  menuItem: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuItemText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500',
  },
  menuItemArrow: {
    ...typography.h2,
    color: colors.textSecondary,
  },
  logoutButton: {
    backgroundColor: colors.error,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  logoutButtonText: {
    ...typography.button,
    color: colors.surface,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    ...typography.h1,
    color: colors.text,
  },
  closeButton: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: spacing.lg,
  },
  formGroup: {
    marginBottom: spacing.md,
  },
  formGroupRow: {
    marginBottom: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    ...typography.bodySmall,
    color: colors.text,
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  helperText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...typography.body,
    color: colors.text,
    minHeight: 48,
  },
  saveButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  saveButtonText: {
    ...typography.button,
    color: colors.surface,
  },
  addButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  addButtonText: {
    ...typography.button,
    color: colors.surface,
  },
  userCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  userUsername: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  deleteUserButton: {
    backgroundColor: colors.error,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  deleteUserButtonText: {
    ...typography.bodySmall,
    color: colors.surface,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  reportsTabContainer: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  reportsTab: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 8,
    backgroundColor: colors.border,
    alignItems: 'center',
  },
  reportsTabActive: {
    backgroundColor: colors.primary,
  },
  reportsTabText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  reportsTabTextActive: {
    color: colors.surface,
  },
  reportsPeriodContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  reportsPeriodButton: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.border,
    alignItems: 'center',
  },
  reportsPeriodButtonActive: {
    backgroundColor: colors.accent,
  },
  reportsPeriodText: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '600',
  },
  reportsPeriodTextActive: {
    color: colors.surface,
  },
  reportsSummaryContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  reportsSummaryCard: {
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
  reportsSummaryLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  reportsSummaryValue: {
    ...typography.h2,
    color: colors.primary,
    textAlign: 'center',
  },
  reportsSummaryValueSmall: {
    ...typography.caption,
    color: colors.text,
  },
  reportsSection: {
    marginTop: spacing.md,
  },
  reportsSectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  reportsProductRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  reportsProductInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  reportsProductName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  reportsProductDetails: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  reportsProductRevenue: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  exportButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  exportButtonText: {
    ...typography.button,
    color: colors.surface,
  },
  printerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  scanButton: {
    flex: 1,
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  scanButtonText: {
    ...typography.bodySmall,
    color: colors.surface,
    fontWeight: '600',
  },
  testButton: {
    flex: 1,
    backgroundColor: colors.accent,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  testButtonText: {
    ...typography.bodySmall,
    color: colors.surface,
    fontWeight: '600',
  },
  printerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  printerInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  printerName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  printerAddress: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  printerStatus: {
    ...typography.caption,
    color: colors.success,
    fontWeight: '600',
  },
  printerStatusInactive: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  printerNote: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  printerNoteText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default ProfileScreen;
