import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { RoomMeasurements } from '../../lib/storage';
import {
  BG_INPUT,
  BORDER_COLOR,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_MUTED,
  TEXT_DIM,
  PDQ_BLUE,
  PDQ_GREEN,
  PDQ_ORANGE,
} from '../../constants/colors';

interface MeasurementsPanelProps {
  measurements: RoomMeasurements | null;
  onUpdate: (measurements: RoomMeasurements) => void;
  onApply: (sqft: number, wallLf: number, ceilingSf: number) => void;
}

function calc(m: RoomMeasurements) {
  const l = parseFloat(m.l) || 0;
  const w = parseFloat(m.w) || 0;
  const h = parseFloat(m.h) || 0;
  const l2 = parseFloat(m.l2) || 0;
  const w2 = parseFloat(m.w2) || 0;

  // Floor area (support L-shaped rooms)
  const floorSf = l2 > 0 && w2 > 0
    ? (l * w) + (l2 * w2)
    : l * w;

  // Perimeter
  const perimeter = l2 > 0 && w2 > 0
    ? 2 * (l + w) + 2 * (l2 + w2) - 2 * Math.min(w, w2)
    : 2 * (l + w);

  // Wall area
  const wallSf = perimeter * h;
  const wallLf = perimeter;

  // Ceiling = floor area
  const ceilingSf = floorSf;

  // IICRC S500 recommendations
  const airMovers = Math.ceil(floorSf / 50); // 1 per 50 sqft
  const dehumidifiers = Math.ceil(floorSf / 1000); // 1 per 1000 sqft
  const airScrubbers = Math.ceil(floorSf / 500); // 1 per 500 sqft

  return {
    floorSf,
    wallSf,
    wallLf,
    ceilingSf,
    perimeter,
    airMovers,
    dehumidifiers,
    airScrubbers,
  };
}

export function MeasurementsPanel({ measurements, onUpdate, onApply }: MeasurementsPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const m: RoomMeasurements = measurements ?? { l: '', w: '', h: '8', l2: '', w2: '' };

  const results = calc(m);
  const hasValues = results.floorSf > 0;

  const updateField = useCallback((field: keyof RoomMeasurements, value: string) => {
    const updated = { ...m, [field]: value };
    onUpdate(updated);
  }, [m, onUpdate]);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.8}
      >
        <Text style={styles.headerText}>
          {'\uD83D\uDCCF'} Room Measurements
          {hasValues ? ` — ${results.floorSf.toFixed(0)} sqft` : ''}
        </Text>
        <Text style={styles.chevron}>{expanded ? '\u25BE' : '\u25B8'}</Text>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.body}>
          {/* Primary dimensions */}
          <View style={styles.dimRow}>
            <DimInput label="L (ft)" value={m.l} onChange={(v) => updateField('l', v)} />
            <Text style={styles.times}>{'\u00D7'}</Text>
            <DimInput label="W (ft)" value={m.w} onChange={(v) => updateField('w', v)} />
            <Text style={styles.times}>{'\u00D7'}</Text>
            <DimInput label="H (ft)" value={m.h} onChange={(v) => updateField('h', v)} />
          </View>

          {/* L-shaped extension */}
          <Text style={styles.extLabel}>L-Shaped Extension (optional)</Text>
          <View style={styles.dimRow}>
            <DimInput label="L2 (ft)" value={m.l2} onChange={(v) => updateField('l2', v)} />
            <Text style={styles.times}>{'\u00D7'}</Text>
            <DimInput label="W2 (ft)" value={m.w2} onChange={(v) => updateField('w2', v)} />
          </View>

          {hasValues && (
            <>
              {/* Calculated values */}
              <View style={styles.calcGrid}>
                <CalcCell label="Floor SF" value={`${results.floorSf.toFixed(0)}`} />
                <CalcCell label="Wall SF" value={`${results.wallSf.toFixed(0)}`} />
                <CalcCell label="Wall LF" value={`${results.wallLf.toFixed(0)}`} />
                <CalcCell label="Ceiling SF" value={`${results.ceilingSf.toFixed(0)}`} />
              </View>

              {/* IICRC S500 Equipment Recommendations */}
              <View style={styles.iicrcBox}>
                <Text style={styles.iicrcTitle}>IICRC S500 Equipment Recommendation</Text>
                <View style={styles.iicrcRow}>
                  <Text style={styles.iicrcLabel}>Air Movers (1/50sf)</Text>
                  <Text style={styles.iicrcValue}>{results.airMovers}</Text>
                </View>
                <View style={styles.iicrcRow}>
                  <Text style={styles.iicrcLabel}>Dehumidifiers (1/1000sf)</Text>
                  <Text style={styles.iicrcValue}>{results.dehumidifiers}</Text>
                </View>
                <View style={styles.iicrcRow}>
                  <Text style={styles.iicrcLabel}>Air Scrubbers (1/500sf)</Text>
                  <Text style={styles.iicrcValue}>{results.airScrubbers}</Text>
                </View>
              </View>

              {/* Apply to items button */}
              <TouchableOpacity
                style={styles.applyBtn}
                onPress={() => onApply(results.floorSf, results.wallLf, results.ceilingSf)}
                activeOpacity={0.8}
              >
                <Text style={styles.applyBtnText}>Apply Measurements to Items</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
    </View>
  );
}

function DimInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <View style={styles.dimInput}>
      <Text style={styles.dimLabel}>{label}</Text>
      <TextInput
        style={styles.dimField}
        value={value}
        onChangeText={onChange}
        keyboardType="decimal-pad"
        placeholder="0"
        placeholderTextColor={TEXT_DIM}
      />
    </View>
  );
}

function CalcCell({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.calcCell}>
      <Text style={styles.calcValue}>{value}</Text>
      <Text style={styles.calcLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#1a2744',
  },
  headerText: {
    color: TEXT_PRIMARY,
    fontWeight: '600',
    fontSize: 13,
  },
  chevron: {
    color: TEXT_DIM,
    fontSize: 14,
  },
  body: {
    padding: 12,
    gap: 10,
  },
  dimRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  times: {
    color: TEXT_DIM,
    fontSize: 16,
    fontWeight: '600',
  },
  dimInput: {
    flex: 1,
  },
  dimLabel: {
    fontSize: 10,
    color: TEXT_DIM,
    fontWeight: '600',
    marginBottom: 2,
  },
  dimField: {
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 14,
    color: TEXT_PRIMARY,
    backgroundColor: BG_INPUT,
    textAlign: 'center',
  },
  extLabel: {
    fontSize: 11,
    color: TEXT_DIM,
    fontWeight: '500',
    marginTop: 4,
  },
  calcGrid: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  calcCell: {
    flex: 1,
    backgroundColor: '#1a2744',
    borderRadius: 6,
    padding: 8,
    alignItems: 'center',
  },
  calcValue: {
    fontSize: 16,
    fontWeight: '800',
    color: PDQ_BLUE,
  },
  calcLabel: {
    fontSize: 9,
    color: TEXT_DIM,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  iicrcBox: {
    backgroundColor: '#0d2818',
    borderRadius: 6,
    padding: 10,
    borderWidth: 1,
    borderColor: '#1a4d2e',
  },
  iicrcTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: PDQ_GREEN,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  iicrcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  iicrcLabel: {
    fontSize: 12,
    color: TEXT_MUTED,
  },
  iicrcValue: {
    fontSize: 14,
    fontWeight: '700',
    color: PDQ_GREEN,
  },
  applyBtn: {
    backgroundColor: PDQ_BLUE,
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: 'center',
  },
  applyBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
});
