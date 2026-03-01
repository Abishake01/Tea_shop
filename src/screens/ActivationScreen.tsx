import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useActivation } from '../context/ActivationContext';
import { colors, spacing, typography } from '../theme';

const ActivationScreen: React.FC = () => {
  const { activate, getDeviceIdForDisplay } = useActivation();
  const [key, setKey] = useState('');
  const [deviceIdDisplay, setDeviceIdDisplay] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    getDeviceIdForDisplay().then(setDeviceIdDisplay);
  }, [getDeviceIdForDisplay]);

  const handleActivate = async () => {
    const trimmed = key.trim();
    if (!trimmed) {
      Alert.alert('Error', 'Please enter your activation key.');
      return;
    }
    setIsLoading(true);
    const result = await activate(trimmed);
    setIsLoading(false);
    if (!result.success) {
      Alert.alert('Activation Failed', result.error ?? 'Invalid key.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Activate App</Text>
          <Text style={styles.subtitle}>Enter your activation key to use this app.</Text>
        </View>

        <View style={styles.deviceIdBox}>
          <Text style={styles.deviceIdLabel}>Your Device ID</Text>
          <Text style={styles.deviceIdValue} selectable>
            {deviceIdDisplay || 'Loading...'}
          </Text>
          <Text style={styles.deviceIdHint}>
            Send this ID to your vendor to receive an activation key.
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Activation Key</Text>
            <TextInput
              style={styles.input}
              placeholder="XXXX-XXXX-XXXX"
              placeholderTextColor={colors.textSecondary}
              value={key}
              onChangeText={setKey}
              autoCapitalize="characters"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleActivate}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <Text style={styles.buttonText}>Activate</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h1,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  deviceIdBox: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  deviceIdLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  deviceIdValue: {
    ...typography.body,
    color: colors.text,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: spacing.xs,
  },
  deviceIdHint: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.bodySmall,
    color: colors.text,
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...typography.body,
    color: colors.text,
    minHeight: 48,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
    minHeight: 48,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    ...typography.button,
    color: colors.surface,
  },
});

export default ActivationScreen;
