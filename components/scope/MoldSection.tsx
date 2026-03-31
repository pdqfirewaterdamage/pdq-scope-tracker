import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Linking,
} from 'react-native';
import { ItemStatus } from '../../constants/templates';
import {
  BG_INPUT,
  BORDER_COLOR,
  PDQ_DARK,
  PDQ_GRAY,
  PDQ_GREEN,
  PDQ_ORANGE,
  PDQ_PURPLE,
  TEXT_DIM,
  TEXT_MUTED,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
} from '../../constants/colors';

interface MoldItem {
  id: string;
  label: string;
  status: ItemStatus;
  hours?: number;
  qty_value?: string;
}

interface MoldSectionProps {
  moldRequired: boolean | null;
  items: MoldItem[];
  onToggle: (required: boolean) => void;
  onUpdateItem: (id: string, data: any) => Promise<void>;
}

const STATUS_CYCLE: ItemStatus[] = ['pending', 'done', 'not_needed'];

function nextStatus(current: ItemStatus): ItemStatus {
  const idx = STATUS_CYCLE.indexOf(current);
  return STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
}

function statusLabel(s: ItemStatus): string {
  switch (s) {
    case 'done': return '\u2713';
    case 'not_needed': return '\u2014';
    default: return '\u25CB';
  }
}

function statusColor(s: ItemStatus): string {
  switch (s) {
    case 'done': return PDQ_GREEN;
    case 'not_needed': return PDQ_GRAY;
    default: return PDQ_PURPLE;
  }
}

// Default mold protocol items when no items are passed
const DEFAULT_MOLD_ITEMS: { id: string; label: string; unit?: string }[] = [
  { id: 'mold_assessment', label: 'Mold assessment / inspection fee' },
  { id: 'mold_remediation_sf', label: 'Mold remediation \u2014 per sq ft', unit: 'SF' },
  { id: 'mold_hepa_scrub', label: 'HEPA vacuum / air scrubbing', unit: 'SF' },
  { id: 'mold_encapsulant', label: 'Apply mold encapsulant', unit: 'SF' },
  { id: 'mold_clearance', label: 'Post-remediation clearance testing' },
];

export function MoldSection({ moldRequired, items, onToggle, onUpdateItem }: MoldSectionProps) {
  const [statuses, setStatuses] = useState<Record<string, ItemStatus>>(
    () => Object.fromEntries(items.map((i) => [i.id, i.status]))
  );
  const [qtyValues, setQtyValues] = useState<Record<string, string>>(
    () => Object.fromEntries(items.map((i) => [i.id, i.qty_value ?? '']))
  );
  const [hoursValues, setHoursValues] = useState<Record<string, 'regular' | 'after'>>(
    () => Object.fromEntries(items.map((i) => [i.id, 'regular']))
  );
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});
  const [noteValues, setNoteValues] = useState<Record<string, string>>({});

  function toggle(id: string) {
    const next = nextStatus(statuses[id] ?? 'pending');
    setStatuses((prev) => ({ ...prev, [id]: next }));
    onUpdateItem(id, { status: next });
  }

  function handleQtyChange(id: string, value: string) {
    setQtyValues((prev) => ({ ...prev, [id]: value }));
    onUpdateItem(id, { qty_value: value });
  }

  function handleHoursChange(id: string, ht: 'regular' | 'after') {
    setHoursValues((prev) => ({ ...prev, [id]: ht }));
    onUpdateItem(id, { hours_type: ht });
  }

  function handleNoteChange(id: string, note: string) {
    setNoteValues((prev) => ({ ...prev, [id]: note }));
    onUpdateItem(id, { note });
  }

  // Use passed items if available, otherwise use defaults
  const displayItems = items.length > 0 ? items : DEFAULT_MOLD_ITEMS.map((d) => ({
    id: d.id,
    label: d.label,
    status: 'pending' as ItemStatus,
  }));

  // Find matching unit for label
  function getUnit(label: string): string | undefined {
    const match = DEFAULT_MOLD_ITEMS.find((d) => label.includes(d.label.split(' \u2014')[0]));
    return match?.unit;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerIcon}>{'\uD83E\uDDA0'}</Text>
        <Text style={styles.headerTitle}>Phase 1.5 — Mold Protocol</Text>
        <TouchableOpacity
          style={styles.infoBtn}
          onPress={() => Linking.openURL('https://iicrc.org/standards/iicrc-s520/')}
          activeOpacity={0.7}
        >
          <Text style={styles.infoBtnText}>{'\u2139'}</Text>
        </TouchableOpacity>
      </View>

      {/* Yes/No Question */}
      <View style={styles.questionRow}>
        <Text style={styles.questionText}>Is mold remediation required?</Text>
        <View style={styles.yesNoRow}>
          <TouchableOpacity
            style={[styles.yesNoBtn, moldRequired === true && styles.yesBtn]}
            onPress={() => onToggle(true)}
          >
            <Text style={[styles.yesNoBtnText, moldRequired === true && { color: '#fff' }]}>
              Yes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.yesNoBtn, moldRequired === false && styles.noBtn]}
            onPress={() => onToggle(false)}
          >
            <Text style={[styles.yesNoBtnText, moldRequired === false && { color: '#fff' }]}>
              No
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* OSHA Warning — shown when not answered */}
      {moldRequired === null && (
        <View style={styles.oshaWarning}>
          <Text style={styles.oshaIcon}>{'\u26A0\uFE0F'}</Text>
          <Text style={styles.oshaText}>
            OSHA REQUIREMENT — Pre-testing for mold contamination is required before remediation
            begins. Follow IICRC S520 standards for assessment and protocol.
          </Text>
        </View>
      )}

      {/* Yes: Show items */}
      {moldRequired === true && (
        <View style={styles.itemsList}>
          {displayItems.map((item) => {
            const status = statuses[item.id] ?? item.status;
            const unit = getUnit(item.label);
            const isNoteExpanded = expandedNotes[item.id] ?? false;
            const ht = hoursValues[item.id] ?? 'regular';

            return (
              <View key={item.id} style={[styles.itemRow, { borderLeftColor: statusColor(status) }]}>
                <View style={styles.itemMain}>
                  <Text style={[styles.itemLabel, status === 'not_needed' && styles.strikethrough]}>
                    {item.label}
                  </Text>
                  <TouchableOpacity
                    style={[styles.statusBtn, { borderColor: statusColor(status) }]}
                    onPress={() => toggle(item.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.statusText, { color: statusColor(status) }]}>
                      {statusLabel(status)}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Qty input */}
                {status !== 'not_needed' && (
                  <View style={styles.qtyRow}>
                    <TextInput
                      style={styles.qtyInput}
                      value={qtyValues[item.id] ?? ''}
                      onChangeText={(v) => handleQtyChange(item.id, v)}
                      placeholder="qty"
                      placeholderTextColor={TEXT_DIM}
                      keyboardType="numeric"
                    />
                    {unit && <Text style={styles.unitLabel}>{unit}</Text>}
                  </View>
                )}

                {/* Hours selector */}
                {status === 'done' && (
                  <View style={styles.hoursRow}>
                    <Text style={styles.hoursLabel}>Hrs:</Text>
                    <TouchableOpacity
                      style={[styles.hoursBtn, ht === 'regular' && styles.hoursBtnActive]}
                      onPress={() => handleHoursChange(item.id, 'regular')}
                    >
                      <Text style={[styles.hoursBtnText, ht === 'regular' && styles.hoursBtnTextActive]}>
                        Regular
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.hoursBtn, ht === 'after' && styles.hoursBtnActive]}
                      onPress={() => handleHoursChange(item.id, 'after')}
                    >
                      <Text style={[styles.hoursBtnText, ht === 'after' && styles.hoursBtnTextActive]}>
                        After
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Notes toggle */}
                <TouchableOpacity
                  onPress={() => setExpandedNotes((p) => ({ ...p, [item.id]: !p[item.id] }))}
                  style={styles.noteToggle}
                >
                  <Text style={styles.noteToggleText}>
                    {isNoteExpanded ? '\u25BE Notes' : '\u25B8 Notes'}
                    {noteValues[item.id] ? ' \uD83D\uDCDD' : ''}
                  </Text>
                </TouchableOpacity>

                {isNoteExpanded && (
                  <TextInput
                    style={styles.noteInput}
                    value={noteValues[item.id] ?? ''}
                    onChangeText={(t) => handleNoteChange(item.id, t)}
                    placeholder="Add notes..."
                    placeholderTextColor={TEXT_DIM}
                    multiline
                  />
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* No: Confirmation */}
      {moldRequired === false && (
        <View style={styles.noRequired}>
          <Text style={styles.noRequiredText}>{'\u2713'} No mold protocol required</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f3e8ff',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: PDQ_PURPLE,
    marginTop: 8,
  },
  header: {
    backgroundColor: '#ede0ff',
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: PDQ_PURPLE,
  },
  headerIcon: {
    fontSize: 16,
  },
  headerTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#4a1d8a',
  },
  infoBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: PDQ_PURPLE + '30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: PDQ_PURPLE,
  },
  questionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#d8b4fe',
  },
  questionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4a1d8a',
    flex: 1,
  },
  yesNoRow: {
    flexDirection: 'row',
    gap: 4,
  },
  yesNoBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#d8b4fe',
    backgroundColor: 'transparent',
  },
  yesBtn: {
    backgroundColor: PDQ_GREEN,
    borderColor: PDQ_GREEN,
  },
  noBtn: {
    backgroundColor: '#64748b',
    borderColor: '#64748b',
  },
  yesNoBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6b21a8',
  },
  oshaWarning: {
    backgroundColor: '#fef3cd',
    padding: 10,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  oshaIcon: {
    fontSize: 16,
  },
  oshaText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#7c4a00',
    lineHeight: 17,
  },
  itemsList: {
    padding: 8,
    gap: 5,
  },
  itemRow: {
    backgroundColor: '#faf5ff',
    borderRadius: 6,
    padding: 8,
    paddingHorizontal: 10,
    borderLeftWidth: 3,
  },
  itemMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  itemLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#3b0764',
    flex: 1,
  },
  strikethrough: {
    textDecorationLine: 'line-through',
    color: PDQ_GRAY,
  },
  statusBtn: {
    width: 36,
    height: 28,
    borderRadius: 6,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '700',
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  qtyInput: {
    width: 60,
    borderWidth: 1,
    borderColor: '#d8b4fe',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 13,
    color: '#3b0764',
    backgroundColor: '#faf5ff',
    textAlign: 'center',
  },
  unitLabel: {
    fontSize: 11,
    color: '#6b21a8',
    fontWeight: '600',
  },
  hoursRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 6,
    alignItems: 'center',
  },
  hoursLabel: {
    fontSize: 11,
    color: '#6b21a8',
    fontWeight: '600',
    marginRight: 4,
  },
  hoursBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#d8b4fe',
    backgroundColor: 'transparent',
  },
  hoursBtnActive: {
    backgroundColor: PDQ_PURPLE,
    borderColor: PDQ_PURPLE,
  },
  hoursBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6b21a8',
  },
  hoursBtnTextActive: {
    color: '#fff',
  },
  noteToggle: {
    marginTop: 4,
    padding: 2,
  },
  noteToggleText: {
    color: '#6b21a8',
    fontSize: 11,
    fontWeight: '500',
  },
  noteInput: {
    backgroundColor: '#faf5ff',
    borderWidth: 1,
    borderColor: '#d8b4fe',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 12,
    color: '#3b0764',
    marginTop: 4,
    minHeight: 40,
  },
  noRequired: {
    padding: 14,
    alignItems: 'center',
  },
  noRequiredText: {
    color: PDQ_GREEN,
    fontWeight: '700',
    fontSize: 14,
  },
});
