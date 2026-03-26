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
  PDQ_BLUE,
  PDQ_DARK,
  PDQ_GRAY,
  PDQ_GREEN,
  PDQ_RED,
  PDQ_ORANGE,
  PDQ_LIGHT,
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

// Group items by subsection
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
  pending: '○',
  done: '✓',
  not_needed: '—',
};
const STATUS_COLOR: Record<Item['status'], string> = {
  pending: PDQ_GRAY,
  done: PDQ_GREEN,
  not_needed: '#9ca3af',
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
  const [expandedPhotos, setExpandedPhotos] = useState<Record<string, boolean>>({});

  const isCat3 = waterCategory === 'cat3';
  const groups = groupBySubsection(items);

  const handleStatusCycle = useCallback(
    async (item: Item) => {
      if (item.mandatory && item.status === 'done') return; // mandatory stays done
      const idx = STATUS_CYCLE.indexOf(item.status);
      let next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
      // mandatory items cannot be not_needed
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
        // silently fail on note save — user is still typing
      }
    },
    [onUpdateItem]
  );

  const handleSectionToggle = useCallback(
    async (subsection: string, isYes: boolean) => {
      setSectionYesNo((prev) => ({ ...prev, [subsection]: isYes }));
      if (!isYes) {
        // Batch N/A all items in this subsection
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
    const isPhotoExpanded = expandedPhotos[item.id] ?? false;
    return (
      <View key={item.id} style={styles.itemRow}>
        <View style={styles.itemMain}>
          {/* Status toggle */}
          <TouchableOpacity
            style={[styles.statusBtn, { borderColor: STATUS_COLOR[item.status] }]}
            onPress={() => handleStatusCycle(item)}
            activeOpacity={0.7}
          >
            <Text style={[styles.statusBtnText, { color: STATUS_COLOR[item.status] }]}>
              {STATUS_LABEL[item.status]}
            </Text>
          </TouchableOpacity>

          <View style={styles.itemLabelCol}>
            <Text style={[styles.itemLabel, item.status === 'not_needed' && styles.strikethrough]}>
              {item.label}
              {item.mandatory ? ' *' : ''}
            </Text>

            {/* Hours selector — only shown for done items that aren't noHours */}
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

            {/* hasNote items — auto-expanded note */}
            {item.has_note && (
              <TextInput
                style={styles.noteInput}
                value={item.note ?? ''}
                onChangeText={(t) => handleNote(item, t)}
                placeholder="Add note…"
                placeholderTextColor={PDQ_GRAY}
                multiline
              />
            )}
          </View>

          {/* Photo toggle */}
          <TouchableOpacity
            style={styles.photoBtn}
            onPress={() =>
              setExpandedPhotos((prev) => ({ ...prev, [item.id]: !isPhotoExpanded }))
            }
          >
            <Text style={styles.photoBtnText}>📷</Text>
          </TouchableOpacity>
        </View>

        {/* TODO: Photo picker expanded view */}
      </View>
    );
  };

  const renderSubsection = (subsection: string, subsectionItems: Item[]) => {
    const sectionState = sectionYesNo[subsection];
    const isNA = sectionState === false;

    // Detect special child subsections rendered separately
    if (subsection === 'Walls' || subsection === 'Ceiling' || subsection === 'Flooring' || subsection === 'Asbestos') {
      return null; // rendered below
    }

    return (
      <View key={subsection} style={styles.subsection}>
        {/* Yes/No header */}
        <View style={styles.subsectionHeader}>
          <Text style={styles.subsectionTitle}>{subsection}</Text>
          <View style={styles.yesNoRow}>
            <TouchableOpacity
              style={[styles.yesNoBtn, sectionState === true && styles.yesBtn]}
              onPress={() => handleSectionToggle(subsection, true)}
            >
              <Text style={[styles.yesNoBtnText, sectionState === true && styles.yesBtnText]}>
                Yes
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.yesNoBtn, sectionState === false && styles.noBtn]}
              onPress={() => handleSectionToggle(subsection, false)}
            >
              <Text style={[styles.yesNoBtnText, sectionState === false && styles.noBtnText]}>
                No
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Items (hidden if N/A) */}
        {!isNA && subsectionItems.map(renderItem)}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Room Header */}
      <TouchableOpacity
        style={styles.roomHeader}
        onPress={() => setExpanded((e) => !e)}
        activeOpacity={0.8}
      >
        <Text style={styles.roomName}>{room.name}</Text>
        <View style={styles.roomHeaderRight}>
          {isCat3 && (
            <View style={styles.cat3Tag}>
              <Text style={styles.cat3TagText}>Cat 3</Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={onDeleteRoom}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.deleteBtnText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.roomBody}>
          {/* Regular subsections */}
          {Object.entries(groups).map(([sub, subItems]) =>
            renderSubsection(sub, subItems)
          )}

          {/* Special: Walls / Ceiling */}
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

          {/* Special: Flooring */}
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

          {/* Special: Asbestos */}
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
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    overflow: 'hidden',
  },
  roomHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: PDQ_BLUE,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  roomName: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
    flex: 1,
  },
  roomHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cat3Tag: {
    backgroundColor: PDQ_RED,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  cat3TagText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  deleteBtn: {
    padding: 4,
  },
  deleteBtnText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  chevron: {
    color: '#fff',
    fontSize: 12,
  },
  roomBody: {
    padding: 12,
  },
  subsection: {
    marginBottom: 12,
  },
  subsectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: PDQ_LIGHT,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
    marginBottom: 6,
  },
  subsectionTitle: {
    fontWeight: '700',
    fontSize: 13,
    color: PDQ_DARK,
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
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#f9fafb',
  },
  yesBtn: {
    backgroundColor: PDQ_GREEN,
    borderColor: PDQ_GREEN,
  },
  noBtn: {
    backgroundColor: '#6b7280',
    borderColor: '#6b7280',
  },
  yesNoBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  yesBtnText: {
    color: '#fff',
  },
  noBtnText: {
    color: '#fff',
  },
  itemRow: {
    marginBottom: 6,
  },
  itemMain: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 4,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  statusBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  statusBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  itemLabelCol: {
    flex: 1,
  },
  itemLabel: {
    fontSize: 14,
    color: PDQ_DARK,
    lineHeight: 20,
  },
  strikethrough: {
    textDecorationLine: 'line-through',
    color: PDQ_GRAY,
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
    borderColor: '#d1d5db',
    backgroundColor: '#f9fafb',
  },
  hoursChipActive: {
    backgroundColor: PDQ_ORANGE,
    borderColor: PDQ_ORANGE,
  },
  hoursChipText: {
    fontSize: 11,
    color: PDQ_DARK,
    fontWeight: '500',
  },
  hoursChipTextActive: {
    color: '#fff',
  },
  noteInput: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#c084fc',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 13,
    color: PDQ_DARK,
    backgroundColor: '#faf5ff',
    minHeight: 36,
  },
  photoBtn: {
    padding: 4,
    marginTop: 2,
  },
  photoBtnText: {
    fontSize: 16,
  },
});
