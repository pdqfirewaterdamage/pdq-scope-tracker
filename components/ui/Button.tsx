import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { PDQ_BLUE, PDQ_RED, PDQ_DARK, PDQ_GRAY } from '../../constants/colors';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
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
          color={variant === 'secondary' || variant === 'ghost' ? PDQ_BLUE : '#fff'}
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
    borderRadius: 8,
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
  sm: { paddingHorizontal: 12, paddingVertical: 6 },
  md: { paddingHorizontal: 16, paddingVertical: 10 },
  lg: { paddingHorizontal: 20, paddingVertical: 14, width: '100%' },
});

const variantStyles: Record<Variant, ViewStyle> = StyleSheet.create({
  primary: { backgroundColor: PDQ_BLUE },
  secondary: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: PDQ_BLUE,
  },
  danger: { backgroundColor: PDQ_RED },
  ghost: { backgroundColor: 'transparent' },
});

const labelStyles: Record<Size, TextStyle> = StyleSheet.create({
  sm: { fontSize: 13 },
  md: { fontSize: 14 },
  lg: { fontSize: 15, textAlign: 'center' },
});

const labelColorStyles: Record<Variant, TextStyle> = StyleSheet.create({
  primary: { color: '#fff' },
  secondary: { color: PDQ_BLUE },
  danger: { color: '#fff' },
  ghost: { color: PDQ_DARK },
});
