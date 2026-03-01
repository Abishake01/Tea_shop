import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useActivation } from '../context/ActivationContext';
import { useAuth } from '../context/AuthContext';
import { AuthNavigator } from './AuthNavigator';
import { BottomTabNavigator } from './BottomTabNavigator';
import ActivationScreen from '../screens/ActivationScreen';
import ErrorBoundary from '../components/common/ErrorBoundary';
import LoadingSpinner from '../components/common/LoadingSpinner';

export const AppNavigator: React.FC = () => {
  const { isActivated, isLoading: activationLoading } = useActivation();
  const { user, isLoading: authLoading } = useAuth();

  if (activationLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (isActivated === false) {
    return <ActivationScreen />;
  }

  if (authLoading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <ErrorBoundary>
      <NavigationContainer>
        {user ? <BottomTabNavigator /> : <AuthNavigator />}
      </NavigationContainer>
    </ErrorBoundary>
  );
};

