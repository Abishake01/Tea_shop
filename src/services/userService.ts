import CryptoJS from 'crypto-js';
import { Storage, StorageKeys } from './storage';
import { User } from '../types';

const SALT = 'tea-shop-salt-2024'; // In production, use a more secure approach

export const hashPassword = (password: string): string => {
  return CryptoJS.SHA256(password + SALT).toString();
};

export const verifyPassword = (password: string, hash: string): boolean => {
  const hashedPassword = hashPassword(password);
  return hashedPassword === hash;
};

export const userService = {
  getAllUsers: (): User[] => {
    return Storage.getArray<User>(StorageKeys.USERS);
  },

  getUserByUsername: (username: string): User | null => {
    const users = userService.getAllUsers();
    return users.find(u => u.username === username) || null;
  },

  getUserById: (id: string): User | null => {
    const users = userService.getAllUsers();
    return users.find(u => u.id === id) || null;
  },

  createUser: (userData: Omit<User, 'id' | 'createdAt'>): User => {
    const users = userService.getAllUsers();
    const newUser: User = {
      ...userData,
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
    };
    users.push(newUser);
    Storage.setArray(StorageKeys.USERS, users);
    return newUser;
  },

  updateUser: (id: string, updates: Partial<User>): User | null => {
    const users = userService.getAllUsers();
    const index = users.findIndex(u => u.id === id);
    if (index === -1) return null;

    users[index] = { ...users[index], ...updates };
    Storage.setArray(StorageKeys.USERS, users);
    return users[index];
  },

  deleteUser: (id: string): boolean => {
    const users = userService.getAllUsers();
    const filtered = users.filter(u => u.id !== id);
    if (filtered.length === users.length) return false;
    Storage.setArray(StorageKeys.USERS, filtered);
    return true;
  },

  login: (username: string, password: string): User | null => {
    const user = userService.getUserByUsername(username);
    if (!user) return null;
    if (!verifyPassword(password, user.password)) return null;
    return user;
  },

  initializeDefaultAdmin: (): void => {
    const users = userService.getAllUsers();
    if (users.length > 0) return; // Already initialized

    const adminUser: User = {
      id: 'admin_001',
      username: 'admin',
      password: hashPassword('admin123'),
      name: 'Administrator',
      role: 'admin',
      createdAt: Date.now(),
    };

    users.push(adminUser);
    Storage.setArray(StorageKeys.USERS, users);
  },
};

