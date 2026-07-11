/**
 * components/InputField.tsx
 * Campo de texto con label en español.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  TextInputProps,
} from 'react-native';
import { colors, radius, spacing, typography } from '../utils/theme';

interface InputFieldProps extends TextInputProps {
  label: string;
  rightLabel?: string;
  onRightLabelPress?: () => void;
  leftIcon?: React.ReactNode;
  error?: string;
}

export function InputField({
  label,
  rightLabel,
  onRightLabelPress,
  leftIcon,
  error,
  secureTextEntry,
  style,
  ...rest
}: InputFieldProps) {
  const [hidden, setHidden] = useState(secureTextEntry);

  return (
    <View style={styles.wrapper}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label.toUpperCase()}</Text>
        {rightLabel ? (
          <TouchableOpacity onPress={onRightLabelPress}>
            <Text style={styles.rightLabel}>{rightLabel}</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={[styles.inputContainer, error ? styles.inputError : null]}>
        {leftIcon ? <View style={styles.iconLeft}>{leftIcon}</View> : null}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={secureTextEntry ? hidden : false}
          {...rest}
        />
        {secureTextEntry ? (
          <TouchableOpacity
            onPress={() => setHidden((v) => !v)}
            style={styles.iconRight}
            hitSlop={8}
          >
            <Text>{hidden ? '👁' : '🙈'}</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.md },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  label: { ...typography.label, color: colors.textSecondary },
  rightLabel: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: 50,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputError: { borderColor: colors.danger },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    paddingVertical: spacing.sm,
  },
  iconLeft: { marginRight: spacing.sm },
  iconRight: { marginLeft: spacing.sm },
  error: {
    ...typography.caption,
    color: colors.danger,
    marginTop: spacing.xs,
  },
});
