import React, { useEffect, useState } from 'react';
import { I18nManager } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import { ProductProvider } from './src/context/ProductContext';
import { CartProvider } from './src/context/CartContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import ErrorBoundary from './src/components/common/ErrorBoundary';
import LoadingSpinner from './src/components/common/LoadingSpinner';
import { Storage } from './src/services/storage';

export default function App() {
  const [isStorageReady, setIsStorageReady] = useState(false);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        await Storage.initialize();
      } finally {
        setIsStorageReady(true);
      }
    };

    void bootstrap();
  }, []);

  useEffect(() => {
    try {
      const direction = I18nManager?.isRTL ? 'rtl' : 'ltr';
      if (I18nManager && !(I18nManager as any).DIRECTION) {
        (I18nManager as any).DIRECTION = direction;
      }
    } catch {
      // Ignore if native I18nManager is unavailable
    }
  }, []);

  if (!isStorageReady) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <ErrorBoundary>
      <AuthProvider>
        <ProductProvider>
          <CartProvider>
            <StatusBar style="auto" />
            <AppNavigator />
          </CartProvider>
        </ProductProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
