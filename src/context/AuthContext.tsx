import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { Storage, StorageKeys } from '../services/storage';
import { userService } from '../services/userService';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAdmin: boolean;
  isStaff: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize default admin on first launch
    userService.initializeDefaultAdmin();

    // Load current user from storage
    const currentUser = Storage.getObject<User>(StorageKeys.CURRENT_USER);
    setUser(currentUser);
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    const loggedInUser = userService.login(username, password);
    if (loggedInUser) {
      setUser(loggedInUser);
      Storage.setObject(StorageKeys.CURRENT_USER, loggedInUser);
      return true;
    }
    return false;
  };

  const logout = (): void => {
    setUser(null);
    Storage.delete(StorageKeys.CURRENT_USER);
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    isAdmin: user?.role === 'admin',
    isStaff: user?.role === 'staff',
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

