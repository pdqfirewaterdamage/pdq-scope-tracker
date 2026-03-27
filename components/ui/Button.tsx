import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { PDQ_ORANGE, PDQ_RED, PDQ_GREEN, PDQ_BLUE, BORDER_COLOR, TEXT_PRIMARY, TEXT_MUTED } from '../../constants/colors';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'green' | 'outline';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.base,
        sizeStyles[size],
        variantStyles[variant],
        isDisabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'secondary' || variant === 'ghost' || variant === 'outline' ? PDQ_BLUE : '#fff'}
          size="small"
        />
      ) : (
        <Text style={[styles.label, labelStyles[size], labelColorStyles[variant]]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontWeight: '700',
  },
});

const sizeStyles: Record<Size, ViewStyle> = StyleSheet.create({
  sm: { paddingHorizontal: 14, paddingVertical: 8 },
  md: { paddingHorizontal: 16, paddingVertical: 12 },
  lg: { paddingHorizontal: 20, paddingVertical: 16, width: '100%' },
});

const variantStyles: Record<Variant, ViewStyle> = StyleSheet.create({
  primary: { backgroundColor: PDQ_ORANGE },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: PDQ_BLUE,
  },
  danger: { backgroundColor: PDQ_RED },
  ghost: { backgroundColor: 'transparent' },
  green: { backgroundColor: PDQ_GREEN },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },
});

const labelStyles: Record<Size, TextStyle> = StyleSheet.create({
  sm: { fontSize: 13 },
  md: { fontSize: 14 },
  lg: { fontSize: 16, textAlign: 'center' },
});

const labelColorStyles: Record<Variant, TextStyle> = StyleSheet.create({
  primary: { color: '#fff' },
  secondary: { color: PDQ_BLUE },
  danger: { color: '#fff' },
  ghost: { color: TEXT_MUTED },
  green: { color: '#fff' },
  outline: { color: TEXT_MUTED },
});
