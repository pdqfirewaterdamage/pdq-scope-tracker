import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type BadgeVariant =
  | 'cat2'
  | 'cat3'
  | 'active'
  | 'complete'
  | 'regular'
  | 'after'
  | 'submitted';

interface BadgeProps {
  variant: BadgeVariant;
  label?: string;
}

const BADGE_CONFIG: Record<
  BadgeVariant,
  { bg: string; text: string; defaultLabel: string }
> = {
  cat2: { bg: '#0077C8', text: '#fff', defaultLabel: 'CAT 2' },
  cat3: { bg: '#d32f2f', text: '#fff', defaultLabel: 'CAT 3' },
  active: { bg: '#dcfce7', text: '#166534', defaultLabel: 'Active' },
  complete: { bg: '#e0e7ff', text: '#3730a3', defaultLabel: 'Complete' },
  regular: { bg: '#f0fdf4', text: '#15803d', defaultLabel: 'Regular' },
  after: { bg: '#fff7ed', text: '#c2410c', defaultLabel: 'After Hours' },
  submitted: { bg: '#f0f9ff', text: '#0369a1', defaultLabel: 'Submitted' },
};

export function Badge({ variant, label }: BadgeProps) {
  const config = BADGE_CONFIG[variant];
  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.text, { color: config.text }]}>
        {label ?? config.defaultLabel}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
