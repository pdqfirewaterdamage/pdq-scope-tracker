import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PDQ_ORANGE, PDQ_GREEN, PDQ_BLUE, PDQ_RED, PDQ_PURPLE } from '../../constants/colors';

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
  cat2: { bg: '#60a5fa1a', text: PDQ_BLUE, defaultLabel: 'CAT 2' },
  cat3: { bg: '#ef44441a', text: PDQ_RED, defaultLabel: 'CAT 3' },
  active: { bg: '#f973161a', text: PDQ_ORANGE, defaultLabel: 'Active' },
  complete: { bg: '#22c55e1a', text: PDQ_GREEN, defaultLabel: 'Complete' },
  regular: { bg: '#22c55e1a', text: PDQ_GREEN, defaultLabel: 'Regular' },
  after: { bg: '#f59e0b1a', text: '#f59e0b', defaultLabel: 'After Hours' },
  submitted: { bg: '#22c55e1a', text: PDQ_GREEN, defaultLabel: 'Submitted' },
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
    borderRadius: 4,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
