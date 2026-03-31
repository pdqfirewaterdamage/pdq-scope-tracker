import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
} from 'react-native';
import { Item, Room, RoomMeasurements } from '../../lib/storage';
import { WallsCeilingUI } from './WallsCeilingUI';
import { FlooringSection } from './FlooringSection';
import { AsbestosSection } from './AsbestosSection';
import { MoldSection } from './MoldSection';
import { MeasurementsPanel } from './MeasurementsPanel';
import { InputTypeField } from './InputTypeField';
import { IICRCPopup, hasReferenceCard } from './IICRCPopup';
import { ItemStatus } from '../../constants/templates';
import {
  BG_CARD,
  BG_INPUT,
  BORDER_COLOR,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_MUTED,
  TEXT_DIM,
  PDQ_GREEN,
  PDQ_RED,
  PDQ_ORANGE,
  PDQ_GRAY,
  PDQ_PURPLE,
  PDQ_BLUE,
} from '../../constants/colors';

interface RoomSectionProps {
  room: Room;
  items: Item[];
  waterCategory: 'cat2' | 'cat3';
  onUpdateItem: (itemId: string, data: Partial<Item>) => Promise<void>;
  onUpdateRoom: (data: Partial<Room>) => Promise<void>;
  onDeleteRoom: () => Promise<void>;
}

type SectionYesNo = Record<string, boolean | null>;

function groupBySubsection(items: Item[]): Record<string, Item[]> {
  const groups: Record<string, Item[]> = {};
  for (const item of items) {
    const key = item.subsection;
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  }
  return groups;
}

const STATUS_CYCLE: Array<Item['status']> = ['pending', 'done', 'not_needed'];
const STATUS_LABEL: Record<Item['status'], string> = {
  pending: '\u25CB',
  done: '\u2713',
  not_needed: '\u2014',
};
const STATUS_COLOR: Record<Item['status'], string> = {
  pending: '#94a3b8',
  done: '#22c55e',
  not_needed: '#f59e0b',
};

export function RoomSection({
  room,
  items,
  waterCategory,
  onUpdateItem,
  onUpdateRoom,
  onDeleteRoom,
}: RoomSectionProps) {
  const [expanded, setExpanded] = useState(true);
  const [sectionYesNo, setSectionYesNo] = useState<SectionYesNo>({});
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});
  const [iicrcItem, setIicrcItem] = useState<string | null>(null);

  const isCat3 = waterCategory === 'cat3';
  const groups = groupBySubsection(items);

  const doneCount = items.filter((i) => i.status === 'done').length;
  const totalCount = items.length;
  const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  const handleStatusCycle = useCallback(
    async (item: Item) => {
      if (item.mandatory && item.status === 'done') return;
      const idx = STATUS_CYCLE.indexOf(item.status);
      let next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
      if (item.mandatory && next === 'not_needed') next = 'pending';

      // Photo requirement check — warn but don't block in prototype
      if (next === 'done' && item.require_photo) {
        // In future, check if photo exists. For now, just remind.
      }

      try {
        await onUpdateItem(item.id, { status: next });
      } catch {
        Alert.alert('Error', 'Failed to update item status');
      }
    },
    [onUpdateItem]
  );

  const handleHoursType = useCallback(
    async (item: Item, hoursType: 'regular' | 'after') => {
      try {
        await onUpdateItem(item.id, { hours_type: hoursType });
      } catch {
        Alert.alert('Error', 'Failed to update hours');
      }
    },
    [onUpdateItem]
  );

  const handleNote = useCallback(
    async (item: Item, note: string) => {
      try {
        await onUpdateItem(item.id, { note });
      } catch {
        // silently fail on note save
      }
    },
    [onUpdateItem]
  );

  const handleSectionToggle = useCallback(
    async (subsection: string, isYes: boolean) => {
      setSectionYesNo((prev) => ({ ...prev, [subsection]: isYes }));
      if (!isYes) {
        const subsectionItems = groups[subsection] ?? [];
        await Promise.all(
          subsectionItems
            .filter((i) => !i.mandatory)
            .map((i) => onUpdateItem(i.id, { status: 'not_needed' }))
        );
      }
    },
    [groups, onUpdateItem]
  );

  const handleMeasurementsUpdate = useCallback(
    (measurements: RoomMeasurements) => {
      onUpdateRoom({ measurements } as Partial<Room>);
    },
    [onUpdateRoom]
  );

  const handleApplyMeasurements = useCallback(
    async (sqft: number, wallLf: number, ceilingSf: number) => {
      // Auto-fill quantity values based on measurements
      const updates: Promise<void>[] = [];
      for (const item of items) {
        if (item.status === 'not_needed') continue;

        let autoValue: string | null = null;

        // Floor-related items get sqft
        if (item.input_type === 'sf' && !item.child_sub) {
          autoValue = sqft.toFixed(0);
        }
        // Wall items
        if (item.child_sub === 'Walls') {
          if (item.input_type === 'lf') autoValue = wallLf.toFixed(0);
          if (item.input_type === 'sf') autoValue = (wallLf * 2).toFixed(0); // 2ft flood cut
        }
        // Ceiling items
        if (item.child_sub === 'Ceiling') {
          if (item.input_type === 'sf') autoValue = ceilingSf.toFixed(0);
        }
        // Insulation matches wall/ceiling sf
        if (item.scope_item_id === 'p3_remove_insulation_wall') {
          autoValue = (wallLf * 2).toFixed(0);
        }
        if (item.scope_item_id === 'p3_remove_ceiling_insulation') {
          autoValue = ceilingSf.toFixed(0);
        }
        // Flood cut lf
        if (item.scope_item_id === 'p3_flood_cut') {
          autoValue = wallLf.toFixed(0);
        }
        // Equipment counts from IICRC
        if (item.scope_item_id === 'p3_air_mover') {
          autoValue = String(Math.ceil(sqft / 50));
        }
        if (item.scope_item_id === 'p1_dehumidifier' || item.scope_item_id === 'p3_dehumidifier_check') {
          autoValue = String(Math.ceil(sqft / 1000));
        }
        if (item.scope_item_id === 'p1_air_scrubber') {
          autoValue = String(Math.ceil(sqft / 500));
        }

        if (autoValue && autoValue !== item.qty_value) {
          updates.push(onUpdateItem(item.id, { qty_value: autoValue }));
        }
      }

      if (updates.length > 0) {
        await Promise.all(updates);
        Alert.alert('Applied', `Auto-filled ${updates.length} item quantities from room measurements.`);
      } else {
        Alert.alert('No Changes', 'No items to auto-fill from measurements.');
      }
    },
    [items, onUpdateItem]
  );

  const renderItem = (item: Item) => {
    const sc = STATUS_COLOR[item.status];
    const isNoteExpanded = expandedNotes[item.id] ?? false;
    const showReference = hasReferenceCard(item.scope_item_id);

    return (
      <View key={item.id} style={[styles.itemRow, { borderLeftColor: sc }]}>
        <View style={styles.itemMain}>
          <View style={styles.itemLabelRow}>
            <Text style={[styles.itemLabel, item.status === 'not_needed' && styles.strikethrough]}>
              {item.label}
              {item.mandatory ? ' *' : ''}
            </Text>
            {item.require_photo && (
              <Text style={styles.photoRequired}>{'\uD83D\uDCF7'}</Text>
            )}
            {showReference && (
              <TouchableOpacity
                style={styles.infoBtn}
                onPress={() => setIicrcItem(item.scope_item_id)}
                activeOpacity={0.7}
              >
                <Text style={styles.infoBtnText}>{'\u2139'}</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.statusBtns}>
            {STATUS_CYCLE.map((s) => (
              <TouchableOpacity
                key={s}
                style={[
                  styles.statusBtn,
                  { borderColor: STATUS_COLOR[s] },
                  item.status === s && { backgroundColor: STATUS_COLOR[s] },
                ]}
                onPress={() => {
                  if (item.status !== s) {
                    // Direct set for explicit button press
                    let target = s;
                    if (item.mandatory && target === 'not_needed') return;
                    onUpdateItem(item.id, { status: target }).catch(() => {});
                  }
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.statusBtnText,
                    { color: item.status === s ? '#fff' : STATUS_COLOR[s] },
                  ]}
                >
                  {STATUS_LABEL[s]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Input type field (qty/pct/lf/sf/drop) */}
        <InputTypeField
          inputType={item.input_type}
          dropOptions={item.drop_options}
          qtyValue={item.qty_value}
          dropValue={item.drop_value}
          status={item.status}
          onChangeQty={(v) => onUpdateItem(item.id, { qty_value: v }).catch(() => {})}
          onChangeDrop={(v) => onUpdateItem(item.id, { drop_value: v }).catch(() => {})}
        />

        {/* Notes toggle + photo indicator */}
        <View style={styles.itemActions}>
          <TouchableOpacity
            onPress={() => setExpandedNotes((p) => ({ ...p, [item.id]: !p[item.id] }))}
            style={styles.noteToggle}
          >
            <Text style={styles.noteToggleText}>
              {isNoteExpanded ? '\u25BE Notes' : '\u25B8 Notes'}
              {item.note ? ' \uD83D\uDCDD' : ''}
            </Text>
          </TouchableOpacity>
          {item.require_photo && item.status === 'done' && (
            <Text style={styles.photoReminder}>{'\uD83D\uDCF7'} Photo needed</Text>
          )}
        </View>

        {/* Expanded note */}
        {isNoteExpanded && (
          <TextInput
            style={styles.noteInput}
            value={item.note ?? ''}
            onChangeText={(t) => handleNote(item, t)}
            placeholder="Add notes..."
            placeholderTextColor={TEXT_DIM}
            multiline
          />
        )}

        {/* Hours selector for done items */}
        {item.status === 'done' && !item.no_hours && (
          <View style={styles.hoursRow}>
            <Text style={styles.hoursLabel}>Hrs:</Text>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((h) => (
              <TouchableOpacity
                key={h}
                style={[
                  styles.hourBtn,
                  item.hours === h && styles.hourBtnActive,
                ]}
                onPress={() => {
                  onUpdateItem(item.id, { hours: h }).catch(() => {});
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.hourBtnText,
                    item.hours === h && styles.hourBtnTextActive,
                  ]}
                >
                  {h}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderSubsection = (subsection: string, subsectionItems: Item[]) => {
    const sectionState = sectionYesNo[subsection];
    const isNA = sectionState === false;

    if (subsection === 'Walls' || subsection === 'Ceiling' || subsection === 'Flooring' || subsection === 'Asbestos' || subsection === 'Mold') {
      return null;
    }

    return (
      <View key={subsection} style={styles.subsection}>
        <View style={styles.subsectionHeader}>
          <Text style={styles.subsectionTitle}>{subsection}</Text>
          <View style={styles.yesNoRow}>
            <TouchableOpacity
              style={[styles.yesNoBtn, sectionState === true && styles.yesBtn]}
              onPress={() => handleSectionToggle(subsection, true)}
            >
              <Text style={[styles.yesNoBtnText, sectionState === true && { color: '#fff' }]}>
                Yes
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.yesNoBtn, sectionState === false && styles.noBtn]}
              onPress={() => handleSectionToggle(subsection, false)}
            >
              <Text style={[styles.yesNoBtnText, sectionState === false && { color: '#fff' }]}>
                No
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {!isNA && (
          <View style={styles.itemsList}>
            {subsectionItems.map(renderItem)}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Room Header */}
      <TouchableOpacity
        style={[styles.roomHeader, expanded && styles.roomHeaderExpanded]}
        onPress={() => setExpanded((e) => !e)}
        activeOpacity={0.8}
      >
        <View style={styles.roomHeaderLeft}>
          <Text style={styles.roomIcon}>{'\uD83C\uDFE0'}</Text>
          <Text style={styles.roomName}>{room.name}</Text>
        </View>
        <View style={styles.roomHeaderRight}>
          <Text style={styles.roomProgress}>{doneCount}/{totalCount}</Text>
          <View style={styles.miniProgress}>
            <View style={[styles.miniProgressFill, { width: `${pct}%` }]} />
          </View>
          <Text style={styles.chevron}>{expanded ? '\u25BE' : '\u25B8'}</Text>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.roomBody}>
          {/* Delete room */}
          <View style={styles.deleteRow}>
            <TouchableOpacity onPress={onDeleteRoom}>
              <Text style={styles.deleteText}>{'\uD83D\uDDD1'} Remove Room</Text>
            </TouchableOpacity>
          </View>

          {/* Measurements Panel */}
          <MeasurementsPanel
            measurements={room.measurements as RoomMeasurements | null}
            onUpdate={handleMeasurementsUpdate}
            onApply={handleApplyMeasurements}
          />

          {Object.entries(groups).map(([sub, subItems]) =>
            renderSubsection(sub, subItems)
          )}

          {(groups['Walls'] || groups['Ceiling']) && (
            <WallsCeilingUI
              roomId={room.id}
              wallsData={
                (room.walls_data as { removed: boolean; floodCutLf: string; insulationSf: string } | null) ?? {
                  removed: false,
                  floodCutLf: '',
                  insulationSf: '',
                }
              }
              ceilingData={
                (room.ceiling_data as { removed: boolean; drywallSf: string; insulationSf: string } | null) ?? {
                  removed: false,
                  drywallSf: '',
                  insulationSf: '',
                }
              }
              onUpdate={(walls, ceiling) =>
                onUpdateRoom({
                  walls_data: walls as unknown as Record<string, unknown>,
                  ceiling_data: ceiling as unknown as Record<string, unknown>,
                })
              }
            />
          )}

          {groups['Flooring'] && (
            <FlooringSection
              roomId={room.id}
              flooringData={
                (room.flooring_data as { removed: boolean; selected: ('Carpet' | 'Padding' | 'Tack Strip' | 'Vinyl' | 'Laminate' | 'Hardwood' | 'Tile' | 'Scrape')[] } | null) ?? {
                  removed: false,
                  selected: [],
                }
              }
              onUpdate={(data) =>
                onUpdateRoom({ flooring_data: data as unknown as Record<string, unknown> })
              }
            />
          )}

          {groups['Asbestos'] && (
            <AsbestosSection
              items={groups['Asbestos'].map((i) => ({ id: i.id, label: i.label, status: i.status }))}
              onUpdateItem={(id: string, status: ItemStatus) => {
                onUpdateItem(id, { status }).catch(() => {});
              }}
            />
          )}

          {groups['Mold'] && (
            <MoldSection
              moldRequired={sectionYesNo['Mold'] ?? null}
              items={groups['Mold'].map((i) => ({
                id: i.id,
                label: i.label,
                status: i.status,
                hours: i.hours ?? undefined,
                qty_value: i.qty_value ?? undefined,
              }))}
              onToggle={(required: boolean) => handleSectionToggle('Mold', required)}
              onUpdateItem={(id: string, data: any) => onUpdateItem(id, data)}
            />
          )}
        </View>
      )}

      {/* IICRC Reference Popup */}
      <IICRCPopup
        visible={iicrcItem !== null}
        itemId={iicrcItem ?? ''}
        onClose={() => setIicrcItem(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: BG_CARD,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    overflow: 'hidden',
  },
  roomHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  roomHeaderExpanded: {
    backgroundColor: '#1a2744',
  },
  roomHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roomIcon: {
    fontSize: 18,
  },
  roomName: {
    color: TEXT_PRIMARY,
    fontWeight: '700',
    fontSize: 15,
  },
  roomHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roomProgress: {
    color: PDQ_GREEN,
    fontWeight: '600',
    fontSize: 12,
  },
  miniProgress: {
    width: 40,
    height: 6,
    backgroundColor: BORDER_COLOR,
    borderRadius: 3,
    overflow: 'hidden',
  },
  miniProgressFill: {
    height: '100%',
    backgroundColor: PDQ_GREEN,
  },
  chevron: {
    color: TEXT_DIM,
    fontSize: 14,
  },
  roomBody: {
    padding: 12,
    paddingTop: 0,
  },
  deleteRow: {
    alignItems: 'flex-end',
    marginBottom: 6,
    marginTop: 6,
  },
  deleteText: {
    color: TEXT_DIM,
    fontSize: 11,
  },
  subsection: {
    marginBottom: 8,
  },
  subsectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: BG_INPUT,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },
  subsectionTitle: {
    fontWeight: '700',
    fontSize: 13,
    color: TEXT_PRIMARY,
    flex: 1,
  },
  yesNoRow: {
    flexDirection: 'row',
    gap: 4,
  },
  yesNoBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: BORDER_COLOR,
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
    color: TEXT_MUTED,
  },
  itemsList: {
    gap: 5,
  },
  itemRow: {
    backgroundColor: BG_INPUT,
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
  itemLabelRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  itemLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: TEXT_SECONDARY,
    lineHeight: 18,
    flex: 1,
  },
  strikethrough: {
    textDecorationLine: 'line-through',
    color: TEXT_MUTED,
  },
  photoRequired: {
    fontSize: 12,
  },
  infoBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: PDQ_BLUE + '30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: PDQ_BLUE,
  },
  statusBtns: {
    flexDirection: 'row',
    gap: 3,
  },
  statusBtn: {
    width: 30,
    height: 30,
    borderRadius: 5,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  itemActions: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    marginTop: 3,
  },
  noteToggle: {
    padding: 2,
  },
  noteToggleText: {
    color: TEXT_DIM,
    fontSize: 11,
    fontWeight: '500',
  },
  photoReminder: {
    fontSize: 10,
    color: PDQ_ORANGE,
    fontWeight: '600',
  },
  noteInput: {
    backgroundColor: BG_CARD,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 12,
    color: TEXT_SECONDARY,
    marginTop: 4,
    minHeight: 40,
  },
  hoursRow: {
    flexDirection: 'row',
    gap: 3,
    marginTop: 6,
    alignItems: 'center',
  },
  hoursLabel: {
    fontSize: 11,
    color: TEXT_DIM,
    fontWeight: '600',
    marginRight: 4,
  },
  hourBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hourBtnActive: {
    backgroundColor: PDQ_ORANGE,
    borderColor: PDQ_ORANGE,
  },
  hourBtnText: {
    fontSize: 12,
    color: TEXT_MUTED,
    fontWeight: '600',
  },
  hourBtnTextActive: {
    color: '#fff',
  },
});
