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
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/userService';
import { settingsService } from '../services/settingsService';
import { User, Settings } from '../types';
import { colors, spacing, typography } from '../theme';

const ProfileScreen: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();
  const [settings, setSettings] = useState<Settings>(settingsService.getSettings());
  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);
  const [isChangePasswordModalVisible, setIsChangePasswordModalVisible] = useState(false);
  const [isUserManagementVisible, setIsUserManagementVisible] = useState(false);
  const [isAddStaffModalVisible, setIsAddStaffModalVisible] = useState(false);
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
  label: {
    ...typography.bodySmall,
    color: colors.text,
    marginBottom: spacing.sm,
    fontWeight: '600',
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
});

export default ProfileScreen;
