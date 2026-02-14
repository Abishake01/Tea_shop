import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import { ProductProvider } from './src/context/ProductContext';
import { CartProvider } from './src/context/CartContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import ErrorBoundary from './src/components/common/ErrorBoundary';

export default function App() {
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
