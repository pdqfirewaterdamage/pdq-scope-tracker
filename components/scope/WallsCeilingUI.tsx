import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from 'react-native';
import { PDQ_BLUE, PDQ_DARK, PDQ_GRAY, PDQ_GREEN } from '../../constants/colors';

interface WallsData {
  removed: boolean;
  floodCutLf: string;
  insulationSf: string;
}

interface CeilingData {
  removed: boolean;
  drywallSf: string;
  insulationSf: string;
}

interface WallsCeilingUIProps {
  roomId: string;
  wallsData: WallsData;
  ceilingData: CeilingData;
  onUpdate: (walls: WallsData, ceiling: CeilingData) => void;
}

export function WallsCeilingUI({
  roomId,
  wallsData,
  ceilingData,
  onUpdate,
}: WallsCeilingUIProps) {
  const [walls, setWalls] = useState<WallsData>(wallsData);
  const [ceiling, setCeiling] = useState<CeilingData>(ceilingData);

  const updateWalls = useCallback(
    (update: Partial<WallsData>) => {
      const next = { ...walls, ...update };
      setWalls(next);
      onUpdate(next, ceiling);
    },
    [walls, ceiling, onUpdate]
  );

  const updateCeiling = useCallback(
    (update: Partial<CeilingData>) => {
      const next = { ...ceiling, ...update };
      setCeiling(next);
      onUpdate(walls, next);
    },
    [walls, ceiling, onUpdate]
  );

  return (
    <View style={styles.container}>
      {/* Walls */}
      <View style={styles.subsection}>
        <View style={styles.subsectionHeader}>
          <Text style={styles.subsectionTitle}>Walls</Text>
          <YesNoToggle
            value={walls.removed}
            onChange={(v) => updateWalls({ removed: v })}
            trueLabel="Removed"
            falseLabel="Not Removed"
          />
        </View>
        {walls.removed && (
          <View style={styles.fields}>
            <MeasurementRow
              label="Flood cut drywall"
              unit="LF"
              value={walls.floodCutLf}
              onChange={(v) => updateWalls({ floodCutLf: v })}
            />
            <MeasurementRow
              label="Remove insulation"
              unit="SF"
              value={walls.insulationSf}
              onChange={(v) => updateWalls({ insulationSf: v })}
            />
          </View>
        )}
      </View>

      {/* Ceiling */}
      <View style={styles.subsection}>
        <View style={styles.subsectionHeader}>
          <Text style={styles.subsectionTitle}>Ceiling</Text>
          <YesNoToggle
            value={ceiling.removed}
            onChange={(v) => updateCeiling({ removed: v })}
            trueLabel="Removed"
            falseLabel="Not Removed"
          />
        </View>
        {ceiling.removed && (
          <View style={styles.fields}>
            <MeasurementRow
              label="Remove ceiling drywall"
              unit="SF"
              value={ceiling.drywallSf}
              onChange={(v) => updateCeiling({ drywallSf: v })}
            />
            <MeasurementRow
              label="Remove ceiling insulation"
              unit="SF"
              value={ceiling.insulationSf}
              onChange={(v) => updateCeiling({ insulationSf: v })}
            />
          </View>
        )}
      </View>
    </View>
  );
}

function YesNoToggle({
  value,
  onChange,
  trueLabel,
  falseLabel,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  trueLabel: string;
  falseLabel: string;
}) {
  return (
    <View style={toggleStyles.row}>
      <TouchableOpacity
        style={[toggleStyles.btn, value && toggleStyles.btnActive]}
        onPress={() => onChange(true)}
      >
        <Text style={[toggleStyles.text, value && toggleStyles.textActive]}>
          {trueLabel}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[toggleStyles.btn, !value && toggleStyles.btnInactive]}
        onPress={() => onChange(false)}
      >
        <Text style={[toggleStyles.text, !value && toggleStyles.textInactive]}>
          {falseLabel}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function MeasurementRow({
  label,
  unit,
  value,
  onChange,
}: {
  label: string;
  unit: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={measStyles.row}>
      <Text style={measStyles.label}>
        {label} ({unit})
      </Text>
      <TextInput
        style={measStyles.input}
        value={value}
        onChangeText={onChange}
        keyboardType="decimal-pad"
        placeholder="0"
        placeholderTextColor={PDQ_GRAY}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    gap: 8,
  },
  subsection: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  subsectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f1f5f9',
  },
  subsectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: PDQ_DARK,
  },
  fields: {
    padding: 10,
    gap: 8,
  },
});

const toggleStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 6,
  },
  btn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#f3f4f6',
  },
  btnActive: {
    backgroundColor: PDQ_GREEN,
    borderColor: PDQ_GREEN,
  },
  btnInactive: {
    backgroundColor: '#6b7280',
    borderColor: '#6b7280',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    color: PDQ_DARK,
  },
  textActive: {
    color: '#fff',
  },
  textInactive: {
    color: '#fff',
  },
});

const measStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 13,
    color: PDQ_DARK,
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    width: 72,
    fontSize: 14,
    color: PDQ_DARK,
    textAlign: 'right',
    backgroundColor: '#fff',
  },
});
