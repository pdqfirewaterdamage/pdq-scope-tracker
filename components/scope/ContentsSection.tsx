import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from 'react-native';
import {
  PDQ_BLUE,
  PDQ_DARK,
  PDQ_GRAY,
  PDQ_RED,
  PDQ_ORANGE,
} from '../../constants/colors';

type ContentsStatus = 'yes' | 'no' | 'not_sure' | null;

interface ContentsData {
  status: ContentsStatus;
  boxes: number | null;
  hours: number | null;
}

interface ContentsSectionProps {
  contentsData: ContentsData;
  waterCategory: 'cat2' | 'cat3';
  onUpdate: (data: ContentsData) => Promise<void>;
}

export function ContentsSection({
  contentsData,
  waterCategory,
  onUpdate,
}: ContentsSectionProps) {
  const [status, setStatus] = useState<ContentsStatus>(contentsData.status);
  const [boxes, setBoxes] = useState<string>(
    contentsData.boxes != null ? String(contentsData.boxes) : ''
  );
  const [hours, setHours] = useState<string>(
    contentsData.hours != null ? String(contentsData.hours) : ''
  );

  const handleStatusChange = useCallback(
    (newStatus: ContentsStatus) => {
      setStatus(newStatus);
      onUpdate({
        status: newStatus,
        boxes: boxes !== '' ? Number(boxes) : null,
        hours: hours !== '' ? Number(hours) : null,
      });
    },
    [boxes, hours, onUpdate]
  );

  const handleBoxesChange = useCallback(
    (val: string) => {
      setBoxes(val);
      onUpdate({
        status,
        boxes: val !== '' ? Number(val) : null,
        hours: hours !== '' ? Number(hours) : null,
      });
    },
    [status, hours, onUpdate]
  );

  const handleHoursChange = useCallback(
    (val: string) => {
      setHours(val);
      onUpdate({
        status,
        boxes: boxes !== '' ? Number(boxes) : null,
        hours: val !== '' ? Number(val) : null,
      });
    },
    [status, boxes, onUpdate]
  );

  const OPTIONS: { label: string; value: ContentsStatus }[] = [
    { label: 'Yes', value: 'yes' },
    { label: 'No', value: 'no' },
    { label: 'Not Sure', value: 'not_sure' },
  ];

  return (
    <View style={styles.card}>
      <Text style={styles.phaseLabel}>Phase 2 — Contents</Text>
      <Text style={styles.question}>Were contents affected?</Text>

      <View style={styles.optionRow}>
        {OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[
              styles.optionBtn,
              status === opt.value && styles.optionBtnActive,
              opt.value === 'not_sure' && status === 'not_sure' && styles.optionBtnWarn,
            ]}
            onPress={() => handleStatusChange(opt.value)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.optionText,
                status === opt.value && styles.optionTextActive,
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {status === 'yes' && (
        <View style={styles.detailsBox}>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Medium boxes</Text>
            <TextInput
              style={styles.numberInput}
              value={boxes}
              onChangeText={handleBoxesChange}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={PDQ_GRAY}
            />
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Hours cleaning contents</Text>
            <TextInput
              style={styles.numberInput}
              value={hours}
              onChangeText={handleHoursChange}
              keyboardType="decimal-pad"
              placeholder="0.0"
              placeholderTextColor={PDQ_GRAY}
            />
          </View>
        </View>
      )}

      {status === 'not_sure' && (
        <View style={styles.alertBox}>
          <Text style={styles.alertText}>
            &#9888; CALL SUPERVISOR — Contents scope unclear. Do not proceed without authorization.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  phaseLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: PDQ_GRAY,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  question: {
    fontSize: 14,
    fontWeight: '600',
    color: PDQ_DARK,
    marginBottom: 10,
  },
  optionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  optionBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  optionBtnActive: {
    backgroundColor: PDQ_BLUE,
    borderColor: PDQ_BLUE,
  },
  optionBtnWarn: {
    backgroundColor: PDQ_RED,
    borderColor: PDQ_RED,
  },
  optionText: {
    fontSize: 13,
    fontWeight: '600',
    color: PDQ_DARK,
  },
  optionTextActive: {
    color: '#fff',
  },
  detailsBox: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 10,
    gap: 10,
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldLabel: {
    fontSize: 13,
    color: PDQ_DARK,
    flex: 1,
  },
  numberInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    width: 80,
    fontSize: 14,
    color: PDQ_DARK,
    textAlign: 'right',
    backgroundColor: '#fafafa',
  },
  alertBox: {
    backgroundColor: '#fff0f0',
    borderWidth: 1.5,
    borderColor: PDQ_RED,
    borderRadius: 8,
    padding: 12,
    marginTop: 4,
  },
  alertText: {
    color: PDQ_RED,
    fontWeight: '700',
    fontSize: 13,
    textAlign: 'center',
  },
});
