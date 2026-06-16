import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import { QuickBiteColors } from '@/constants/quickbite';

type AuthInputProps = TextInputProps & {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  rightElement?: React.ReactNode;
  error?: string;
};

export function AuthInput({
  label,
  icon,
  rightElement,
  error,
  secureTextEntry,
  ...props
}: AuthInputProps) {
  const [isSecure, setIsSecure] = useState(Boolean(secureTextEntry));

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.inputContainer, error ? styles.inputError : null]}>
        <Ionicons name={icon} size={18} color={QuickBiteColors.textMuted} style={styles.leftIcon} />
        <TextInput
          {...props}
          secureTextEntry={isSecure}
          placeholderTextColor={QuickBiteColors.textMuted}
          style={styles.input}
        />
        {secureTextEntry ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isSecure ? 'Mostrar contraseña' : 'Ocultar contraseña'}
            onPress={() => setIsSecure((current) => !current)}
            style={styles.toggleButton}>
            <Ionicons
              name={isSecure ? 'eye-outline' : 'eye-off-outline'}
              size={18}
              color={QuickBiteColors.textMuted}
            />
          </Pressable>
        ) : null}
        {rightElement}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: QuickBiteColors.text,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: QuickBiteColors.border,
    borderRadius: 14,
    backgroundColor: QuickBiteColors.white,
    minHeight: 52,
    paddingHorizontal: 14,
  },
  inputError: {
    borderColor: QuickBiteColors.error,
  },
  leftIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: QuickBiteColors.text,
    paddingVertical: 12,
  },
  toggleButton: {
    padding: 4,
    marginLeft: 8,
  },
  errorText: {
    fontSize: 12,
    color: QuickBiteColors.error,
  },
});
