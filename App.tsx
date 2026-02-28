import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
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

  if (!isStorageReady) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <AuthProvider>
          <ProductProvider>
            <CartProvider>
              <StatusBar style="auto" />
              <AppNavigator />
            </CartProvider>
          </ProductProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
