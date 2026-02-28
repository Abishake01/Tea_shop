import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import HomeScreen from '../screens/HomeScreen';
import BillingScreen from '../screens/BillingScreen';
import TokenScreen from '../screens/TokenScreen';
import ProductScreen from '../screens/ProductScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { colors } from '../theme';

export type BottomTabParamList = {
  Home: undefined;
  Billing: { openReceiptId?: string } | undefined;
  Token: { openReceiptId?: string } | undefined;
  Product: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<BottomTabParamList>();

export const BottomTabNavigator: React.FC = () => {
  const { isAdmin } = useAuth();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingTop: 10,
          paddingBottom: Math.max(12, insets.bottom) + 8,
          height: 56 + Math.max(12, insets.bottom),
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => (
            <TabIcon name="home" color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Billing"
        component={BillingScreen}
        options={{
          tabBarLabel: 'Billing',
          tabBarIcon: ({ color }) => (
            <TabIcon name="receipt" color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Token"
        component={TokenScreen}
        options={{
          tabBarLabel: 'Token',
          tabBarIcon: ({ color }) => (
            <TabIcon name="ticket" color={color} />
          ),
        }}
      />
      {isAdmin && (
        <Tab.Screen
          name="Product"
          component={ProductScreen}
          options={{
            tabBarLabel: 'Product',
            tabBarIcon: ({ color }) => (
              <TabIcon name="package" color={color} />
            ),
          }}
        />
      )}
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => (
            <TabIcon name="user" color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// Simple icon component (using emoji for now, can be replaced with react-native-vector-icons later)
const TabIcon: React.FC<{ name: string; color: string }> = ({ name }) => {
  const icons: Record<string, string> = {
    home: '🏠',
    receipt: '🧾',
    ticket: '🎫',
    package: '📦',
    user: '👤',
  };
  return <Text style={{ fontSize: 24 }}>{icons[name] || '•'}</Text>;
};

