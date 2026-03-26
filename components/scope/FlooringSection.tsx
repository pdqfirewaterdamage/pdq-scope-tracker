import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { PDQ_BLUE, PDQ_DARK, PDQ_GRAY, PDQ_GREEN } from '../../constants/colors';

const FLOORING_TYPES = [
  'Carpet',
  'Padding',
  'Tack Strip',
  'Vinyl',
  'Laminate',
  'Hardwood',
  'Tile',
  'Scrape',
] as const;

type FlooringType = (typeof FLOORING_TYPES)[number];

interface FlooringData {
  removed: boolean;
  selected: FlooringType[];
}

interface FlooringSectionProps {
  roomId: string;
  flooringData: FlooringData;
  onUpdate: (data: FlooringData) => void;
}

export function FlooringSection({
  roomId,
  flooringData,
  onUpdate,
}: FlooringSectionProps) {
  const [removed, setRemoved] = useState<boolean>(flooringData.removed);
  const [selected, setSelected] = useState<FlooringType[]>(flooringData.selected);

  const handleRemovedChange = useCallback(
    (val: boolean) => {
      setRemoved(val);
      onUpdate({ removed: val, selected });
    },
    [selected, onUpdate]
  );

  const toggleChip = useCallback(
    (type: FlooringType) => {
      const next = selected.includes(type)
        ? selected.filter((s) => s !== type)
        : [...selected, type];
      setSelected(next);
      onUpdate({ removed, selected: next });
    },
    [removed, selected, onUpdate]
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Flooring</Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleBtn, removed && styles.toggleActive]}
            onPress={() => handleRemovedChange(true)}
          >
            <Text style={[styles.toggleText, removed && styles.toggleTextActive]}>
              Removed
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, !removed && styles.toggleInactive]}
            onPress={() => handleRemovedChange(false)}
          >
            <Text style={[styles.toggleText, !removed && styles.toggleTextActive]}>
              Not Removed
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {removed && (
        <View style={styles.chipsContainer}>
          <Text style={styles.chipsLabel}>Select flooring types removed:</Text>
          <View style={styles.chips}>
            {FLOORING_TYPES.map((type) => {
              const isSelected = selected.includes(type);
              return (
                <TouchableOpacity
                  key={type}
                  style={[styles.chip, isSelected && styles.chipSelected]}
                  onPress={() => toggleChip(type)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[styles.chipText, isSelected && styles.chipTextSelected]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginTop: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f1f5f9',
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: PDQ_DARK,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 6,
  },
  toggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#f3f4f6',
  },
  toggleActive: {
    backgroundColor: PDQ_GREEN,
    borderColor: PDQ_GREEN,
  },
  toggleInactive: {
    backgroundColor: '#6b7280',
    borderColor: '#6b7280',
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: PDQ_DARK,
  },
  toggleTextActive: {
    color: '#fff',
  },
  chipsContainer: {
    padding: 10,
  },
  chipsLabel: {
    fontSize: 12,
    color: PDQ_GRAY,
    marginBottom: 8,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
  },
  chipSelected: {
    backgroundColor: PDQ_BLUE,
    borderColor: PDQ_BLUE,
  },
  chipText: {
    fontSize: 13,
    color: PDQ_DARK,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#fff',
    fontWeight: '700',
  },
});
