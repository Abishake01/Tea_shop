import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CartItem, Product } from '../types';

export type PaymentMethod = 'Cash' | 'Card' | 'Scanner' | 'Bank Account';

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  subtotal: number;
  tax: number;
  total: number;
  itemCount: number;
  paymentMethod: PaymentMethod;
  setPaymentMethod: (method: PaymentMethod) => void;
  isCompliment: boolean;
  setIsCompliment: (value: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [isCompliment, setIsCompliment] = useState(false);

  const addItem = useCallback((product: Product) => {
    setItems(prevItems => {
      const existingItem = prevItems.find(item => item.productId === product.id);
      
      if (existingItem) {
        // Increase quantity if item already exists
        return prevItems.map(item =>
          item.productId === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                subtotal: (item.quantity + 1) * item.unitPrice * (1 + item.tax / 100),
              }
            : item
        );
      } else {
        // Add new item
        const subtotal = product.price * (1 + product.tax / 100);
        return [
          ...prevItems,
          {
            productId: product.id,
            productName: product.name,
            quantity: 1,
            unitPrice: product.price,
            tax: product.tax,
            subtotal,
          },
        ];
      }
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems(prevItems => prevItems.filter(item => item.productId !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }

    setItems(prevItems =>
      prevItems.map(item =>
        item.productId === productId
          ? {
              ...item,
              quantity,
              subtotal: quantity * item.unitPrice * (1 + item.tax / 100),
            }
          : item
      )
    );
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setItems([]);
    setIsCompliment(false);
  }, []);

  const subtotal = isCompliment ? 0 : items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const tax = isCompliment ? 0 : items.reduce((sum, item) => {
    const itemSubtotal = item.quantity * item.unitPrice;
    return sum + itemSubtotal * (item.tax / 100);
  }, 0);
  const total = isCompliment ? 0 : subtotal + tax;
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const value: CartContextType = {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    subtotal,
    tax,
    total,
    itemCount,
    paymentMethod,
    setPaymentMethod,
    isCompliment,
    setIsCompliment,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

