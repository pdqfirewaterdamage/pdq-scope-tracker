import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
} from 'react-native';
import { Item, Room } from '../../lib/storage';
import { WallsCeilingUI } from './WallsCeilingUI';
import { FlooringSection } from './FlooringSection';
import { AsbestosSection } from './AsbestosSection';
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

  const renderItem = (item: Item) => {
    const sc = STATUS_COLOR[item.status];
    const isNoteExpanded = expandedNotes[item.id] ?? false;

    return (
      <View key={item.id} style={[styles.itemRow, { borderLeftColor: sc }]}>
        <View style={styles.itemMain}>
          <Text style={[styles.itemLabel, item.status === 'not_needed' && styles.strikethrough]}>
            {item.label}
            {item.mandatory ? ' *' : ''}
          </Text>
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
                    onUpdateItem(item.id, { status: s }).catch(() => {});
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

        {/* Notes toggle + photo button */}
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

        {/* Hours type for done items */}
        {item.status === 'done' && !item.no_hours && (
          <View style={styles.hoursRow}>
            {(['regular', 'after'] as const).map((ht) => (
              <TouchableOpacity
                key={ht}
                style={[styles.hoursChip, item.hours_type === ht && styles.hoursChipActive]}
                onPress={() => handleHoursType(item, ht)}
              >
                <Text
                  style={[styles.hoursChipText, item.hours_type === ht && styles.hoursChipTextActive]}
                >
                  {ht === 'regular' ? 'Reg' : 'After'}
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

    if (subsection === 'Walls' || subsection === 'Ceiling' || subsection === 'Flooring' || subsection === 'Asbestos') {
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
        </View>
      )}
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
  itemLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: TEXT_SECONDARY,
    flex: 1,
    lineHeight: 18,
  },
  strikethrough: {
    textDecorationLine: 'line-through',
    color: TEXT_MUTED,
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
    gap: 4,
    marginTop: 4,
  },
  hoursChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    backgroundColor: 'transparent',
  },
  hoursChipActive: {
    backgroundColor: PDQ_ORANGE,
    borderColor: PDQ_ORANGE,
  },
  hoursChipText: {
    fontSize: 11,
    color: TEXT_MUTED,
    fontWeight: '500',
  },
  hoursChipTextActive: {
    color: '#fff',
  },
});
