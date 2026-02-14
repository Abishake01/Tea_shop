import { useCallback } from 'react';
import { Alert } from 'react-native';

export const useErrorHandler = () => {
  const handleError = useCallback((error: Error | string, title: string = 'Error') => {
    const message = typeof error === 'string' ? error : error.message;
    Alert.alert(title, message, [{ text: 'OK' }]);
    console.error(`${title}:`, error);
  }, []);

  return { handleError };
};

