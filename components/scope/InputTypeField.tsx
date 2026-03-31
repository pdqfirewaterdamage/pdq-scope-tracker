import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {
  BG_INPUT,
  BORDER_COLOR,
  TEXT_PRIMARY,
  TEXT_DIM,
  PDQ_BLUE,
  PDQ_ORANGE,
} from '../../constants/colors';

interface InputTypeFieldProps {
  inputType: string | null;
  dropOptions: string[] | null;
  qtyValue: string | null;
  dropValue: string | null;
  status: string;
  onChangeQty: (value: string) => void;
  onChangeDrop: (value: string) => void;
}

const UNIT_LABELS: Record<string, string> = {
  pct: '%',
  qty: 'qty',
  lf: 'LF',
  sf: 'SF',
};

export function InputTypeField({
  inputType,
  dropOptions,
  qtyValue,
  dropValue,
  status,
  onChangeQty,
  onChangeDrop,
}: InputTypeFieldProps) {
  if (!inputType || status === 'not_needed') return null;

  if (inputType === 'drop' && dropOptions && dropOptions.length > 0) {
    return (
      <View style={styles.dropRow}>
        {dropOptions.map((opt) => (
          <TouchableOpacity
            key={opt}
            style={[
              styles.dropChip,
              dropValue === opt && styles.dropChipActive,
            ]}
            onPress={() => onChangeDrop(opt)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.dropChipText,
                dropValue === opt && styles.dropChipTextActive,
              ]}
            >
              {opt}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  const unit = UNIT_LABELS[inputType] ?? '';

  return (
    <View style={styles.qtyRow}>
      <TextInput
        style={styles.qtyInput}
        value={qtyValue ?? ''}
        onChangeText={onChangeQty}
        keyboardType="decimal-pad"
        placeholder="0"
        placeholderTextColor={TEXT_DIM}
      />
      {unit ? <Text style={styles.unitLabel}>{unit}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  qtyInput: {
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 13,
    color: TEXT_PRIMARY,
    backgroundColor: BG_INPUT,
    width: 60,
    textAlign: 'center',
  },
  unitLabel: {
    fontSize: 11,
    color: TEXT_DIM,
    fontWeight: '600',
  },
  dropRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  dropChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    backgroundColor: 'transparent',
  },
  dropChipActive: {
    backgroundColor: PDQ_BLUE,
    borderColor: PDQ_BLUE,
  },
  dropChipText: {
    fontSize: 12,
    color: TEXT_DIM,
    fontWeight: '600',
  },
  dropChipTextActive: {
    color: '#fff',
  },
});
