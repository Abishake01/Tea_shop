import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  getDeviceId,
  getActivationStatus,
  setActivated,
  clearActivation,
  validateActivationKey,
} from '../services/activationService';

type ActivationContextType = {
  isActivated: boolean | null;
  isLoading: boolean;
  deviceId: string | null;
  activate: (key: string) => Promise<{ success: boolean; error?: string }>;
  getDeviceIdForDisplay: () => Promise<string>;
};

const ActivationContext = createContext<ActivationContextType | undefined>(undefined);

export const ActivationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isActivated, setIsActivated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deviceId, setDeviceId] = useState<string | null>(null);

  const checkActivation = useCallback(async () => {
    setIsLoading(true);
    try {
      const [currentDeviceId, status] = await Promise.all([
        getDeviceId(),
        getActivationStatus(),
      ]);
      setDeviceId(currentDeviceId);

      if (!status.activated || !status.deviceId) {
        setIsActivated(false);
        return;
      }
      if (status.deviceId !== currentDeviceId) {
        await clearActivation();
        setIsActivated(false);
        return;
      }
      setIsActivated(true);
    } catch {
      setIsActivated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void checkActivation();
  }, [checkActivation]);

  const activate = useCallback(
    async (key: string): Promise<{ success: boolean; error?: string }> => {
      const currentId = deviceId ?? (await getDeviceId());
      if (!currentId) {
        return { success: false, error: 'Could not get device ID' };
      }
      if (!validateActivationKey(currentId, key)) {
        return { success: false, error: 'Invalid key or key not valid for this device.' };
      }
      try {
        await setActivated(currentId);
        setDeviceId(currentId);
        setIsActivated(true);
        return { success: true };
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Could not save activation';
        return { success: false, error: message };
      }
    },
    [deviceId]
  );

  const getDeviceIdForDisplay = useCallback(async (): Promise<string> => {
    return deviceId ?? getDeviceId();
  }, [deviceId]);

  const value: ActivationContextType = {
    isActivated,
    isLoading,
    deviceId,
    activate,
    getDeviceIdForDisplay,
  };

  return (
    <ActivationContext.Provider value={value}>{children}</ActivationContext.Provider>
  );
};

export function useActivation(): ActivationContextType {
  const ctx = useContext(ActivationContext);
  if (ctx === undefined) {
    throw new Error('useActivation must be used within ActivationProvider');
  }
  return ctx;
}
