import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSheet } from '../../../../hooks/useSheet';
import { getProject, createRoom, createItems, updateSheet, deleteRoom, Project } from '../../../../lib/storage';
import { RoomSection } from '../../../../components/scope/RoomSection';
import { ContentsSection } from '../../../../components/scope/ContentsSection';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { makeRoomItems, countPendingItems, ROOM_PRESETS, RoomItem } from '../../../../constants/templates';
import {
  BG_APP,
  BG_CARD,
  BG_INPUT,
  BORDER_COLOR,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_MUTED,
  TEXT_DIM,
  PDQ_ORANGE,
  PDQ_RED,
  PDQ_GREEN,
  PDQ_GRAY,
} from '../../../../constants/colors';
import { Item, Room } from '../../../../lib/storage';

export default function TechSheetScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { sheet, rooms, loading, error, updateItem, updateRoom, submitSheet, refresh } =
    useSheet(id);

  const [project, setProject] = useState<Project | null>(null);
  const [techName, setTechName] = useState('');
  const [techNameError, setTechNameError] = useState(false);
  const [hoursType, setHoursType] = useState<'regular' | 'after'>('regular');
  const [submitting, setSubmitting] = useState(false);

  // Room picker state
  const [roomPickerVisible, setRoomPickerVisible] = useState(false);
  const [customRoomName, setCustomRoomName] = useState('');
  const [addingRoom, setAddingRoom] = useState(false);

  // Stats
  const allItems = rooms.flatMap((r) => r.items as Item[]);
  const doneCount = allItems.filter((i) => i.status === 'done').length;
  const naCount = allItems.filter((i) => i.status === 'not_needed').length;
  const pendingCount = allItems.filter((i) => i.status === 'pending').length;
  const totalCount = allItems.length;
  const progressPct = totalCount > 0 ? ((doneCount + naCount) / totalCount) * 100 : 0;

  useEffect(() => {
    if (sheet?.project_id) {
      getProject(sheet.project_id).then(setProject).catch(() => null);
      if (sheet.tech_name) setTechName(sheet.tech_name);
      if (sheet.hours_type) setHoursType(sheet.hours_type);
    }
  }, [sheet?.project_id, sheet?.tech_name, sheet?.hours_type]);

  const isCat3 = project?.water_category === 'cat3';

  const handleAddRoom = useCallback(
    async (roomName: string) => {
      if (!sheet || !project) return;
      const name = roomName.trim();
      if (!name) return;
      setAddingRoom(true);
      try {
        const room = await createRoom({
          sheet_id: sheet.id,
          name,
          sort_order: rooms.length,
          walls_data: null,
          ceiling_data: null,
          flooring_data: null,
        });

        const waterCat = project.water_category === 'cat3' ? 'cat3' : 'cat2';
        const templateItems: RoomItem[] = makeRoomItems(waterCat);
        const dbItems = templateItems.map((ti) => ({
          room_id: room.id,
          scope_item_id: ti.id,
          label: ti.label,
          phase: ti.phase,
          subsection: ti.subsection,
          child_sub: ti.childSub ?? null,
          input_type: ti.inputType ?? null,
          drop_options: ti.dropOptions ?? null,
          no_hours: ti.noHours ?? false,
          mandatory: ti.mandatory ?? false,
          has_note: ti.hasNote ?? null,
          sort_order: ti.sortOrder,
          status: 'pending' as const,
          hours: null,
          hours_type: 'regular' as const,
          note: null,
        }));

        await createItems(dbItems);
        setRoomPickerVisible(false);
        setCustomRoomName('');
        await refresh();
      } catch (err: unknown) {
        Alert.alert('Error', err instanceof Error ? err.message : 'Failed to add room');
      } finally {
        setAddingRoom(false);
      }
    },
    [sheet, project, rooms.length, refresh]
  );

  const handleSubmit = useCallback(async () => {
    if (!techName.trim()) {
      setTechNameError(true);
      Alert.alert('Required', 'Please enter the technician name before submitting.');
      return;
    }
    setTechNameError(false);

    const allRoomItems: RoomItem[] = rooms.flatMap((r) =>
      (r.items as Item[]).map((i) => ({
        id: i.scope_item_id,
        label: i.label,
        phase: i.phase,
        subsection: i.subsection,
        childSub: i.child_sub ?? undefined,
        inputType: (i.input_type as RoomItem['inputType']) ?? undefined,
        dropOptions: i.drop_options ?? undefined,
        noHours: i.no_hours,
        mandatory: i.mandatory,
        hasNote: i.has_note ?? undefined,
        sortOrder: i.sort_order,
        status: i.status,
        hours: i.hours ?? undefined,
        hoursType: i.hours_type,
        note: i.note ?? undefined,
      }))
    );

    const { pending, doneWithoutHours } = countPendingItems(allRoomItems);

    if (pending > 0) {
      Alert.alert(
        'Pending Items',
        `There are ${pending} item(s) still marked as pending. Please mark all items as Done or N/A before submitting.`,
        [{ text: 'OK' }]
      );
      return;
    }

    if (doneWithoutHours > 0) {
      Alert.alert(
        'Missing Hours',
        `${doneWithoutHours} done item(s) are missing hours. Please enter hours for all completed items before submitting.`,
        [{ text: 'OK' }]
      );
      return;
    }

    setSubmitting(true);
    try {
      await submitSheet(techName.trim());
      Alert.alert('Submitted!', 'Sheet submitted successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to submit sheet');
    } finally {
      setSubmitting(false);
    }
  }, [techName, rooms, submitSheet, router]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={PDQ_ORANGE} />
      </View>
    );
  }

  if (error || !sheet) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error ?? 'Sheet not found.'}</Text>
        <Button label="Retry" variant="primary" size="sm" onPress={refresh} />
      </View>
    );
  }

  if (sheet.submitted) {
    return (
      <View style={styles.centered}>
        <Text style={styles.submittedIcon}>{'\u2713'}</Text>
        <Text style={styles.submittedText}>Sheet Submitted</Text>
        <Text style={styles.submittedSub}>
          This sheet was submitted on{' '}
          {sheet.submitted_at
            ? new Date(sheet.submitted_at).toLocaleDateString()
            : 'N/A'}
        </Text>
        <Button label="Go Back" variant="outline" size="md" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Cat 3 Warning Banner */}
      {isCat3 && (
        <View style={styles.cat3Banner}>
          <Text style={styles.cat3BannerText}>
            {'\u26A0'} CATEGORY 3 — Hydroxyl Generator REQUIRED. Extra PPE mandatory.
          </Text>
        </View>
      )}

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Project banner */}
        {project && (
          <View style={styles.banner}>
            <Text style={styles.bannerTitle}>{project.job_name}</Text>
            {project.address ? (
              <Text style={styles.bannerAddress}>{project.address}</Text>
            ) : null}
          </View>
        )}

        {/* Stats Card */}
        <View style={styles.card}>
          <View style={styles.statsHeader}>
            <Text style={styles.statsTitle}>
              {sheet.date === new Date().toISOString().slice(0, 10) ? 'Today' : sheet.date}
            </Text>
            {sheet.submitted && (
              <View style={styles.submittedBadge}>
                <Text style={styles.submittedBadgeText}>Submitted</Text>
              </View>
            )}
          </View>

          <TextInput
            style={[styles.input, techNameError && styles.inputError]}
            value={techName}
            onChangeText={(t) => {
              setTechName(t);
              if (t.trim()) setTechNameError(false);
            }}
            placeholder="Tech name"
            placeholderTextColor={TEXT_DIM}
          />

          <View style={styles.statsRow}>
            <Text style={{ color: PDQ_GREEN, fontWeight: '600', fontSize: 13 }}>
              {'\u2713'} {doneCount}
            </Text>
            <Text style={{ color: '#f59e0b', fontWeight: '600', fontSize: 13 }}>
              — {naCount} N/A
            </Text>
            <Text style={{ color: TEXT_MUTED, fontWeight: '600', fontSize: 13 }}>
              {'\u25CB'} {pendingCount} left
            </Text>
            <Text style={{ color: TEXT_DIM, fontSize: 13 }}>
              {rooms.length} room{rooms.length !== 1 ? 's' : ''}
            </Text>
          </View>

          {totalCount > 0 && (
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
            </View>
          )}

          {/* Hours Type */}
          <View style={styles.chipRow}>
            {(['regular', 'after'] as const).map((ht) => (
              <TouchableOpacity
                key={ht}
                style={[styles.chip, hoursType === ht && styles.chipActive]}
                onPress={() => setHoursType(ht)}
              >
                <Text
                  style={[styles.chipText, hoursType === ht && styles.chipTextActive]}
                >
                  {ht === 'regular' ? 'Regular Hours' : 'After Hours'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Rooms */}
        {rooms.map((room) => (
          <RoomSection
            key={room.id}
            room={room}
            items={room.items as Item[]}
            waterCategory={isCat3 ? 'cat3' : 'cat2'}
            onUpdateItem={updateItem}
            onUpdateRoom={(data) => updateRoom(room.id, data as Partial<Room>)}
            onDeleteRoom={async () => {
              Alert.alert(
                'Delete Room',
                `Remove "${room.name}" and all its items?`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        await deleteRoom(room.id);
                        await refresh();
                      } catch (e) {
                        Alert.alert('Error', 'Failed to delete room');
                      }
                    },
                  },
                ]
              );
            }}
          />
        ))}

        {/* Add Room Button */}
        <TouchableOpacity
          style={styles.addRoomBtn}
          onPress={() => setRoomPickerVisible(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.addRoomText}>{'\uD83C\uDFE0'} + Add Room</Text>
        </TouchableOpacity>

        {/* Contents Section */}
        <ContentsSection
          contentsData={{
            status: sheet.contents_status,
            boxes: sheet.contents_boxes,
            hours: sheet.contents_hours,
          }}
          waterCategory={isCat3 ? 'cat3' : 'cat2'}
          onUpdate={async (data) => {
            try {
              await updateSheet(sheet.id, {
                contents_status: data.status,
                contents_boxes: data.boxes,
                contents_hours: data.hours,
              });
            } catch (e) {
              console.error(e);
            }
          }}
        />

        {/* Submit */}
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.8}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>Submit Today's Scope Sheet</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Room Picker Modal */}
      <Modal
        visible={roomPickerVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setRoomPickerVisible(false)}
      >
        <View style={styles.pickerContainer}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>Add a Room</Text>
            <TouchableOpacity onPress={() => setRoomPickerVisible(false)}>
              <Text style={styles.pickerClose}>Cancel</Text>
            </TouchableOpacity>
          </View>

          {/* Preset chips */}
          <View style={styles.presetChips}>
            {ROOM_PRESETS.filter(
              (rp) => !rooms.some((r) => r.name === rp)
            ).map((rp) => (
              <TouchableOpacity
                key={rp}
                style={styles.presetChip}
                onPress={() => handleAddRoom(rp)}
                disabled={addingRoom}
              >
                <Text style={styles.presetChipText}>{rp}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Custom room input */}
          <View style={styles.customNameRow}>
            <TextInput
              style={styles.customInput}
              value={customRoomName}
              onChangeText={setCustomRoomName}
              placeholder="Custom room name..."
              placeholderTextColor={TEXT_DIM}
              onSubmitEditing={() => handleAddRoom(customRoomName)}
            />
            <TouchableOpacity
              style={[
                styles.customAddBtn,
                (!customRoomName.trim() || addingRoom) && styles.btnDisabled,
              ]}
              onPress={() => handleAddRoom(customRoomName)}
              disabled={!customRoomName.trim() || addingRoom}
            >
              {addingRoom ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.customAddBtnText}>Add</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_APP,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 12,
    backgroundColor: BG_APP,
  },
  errorText: {
    color: PDQ_RED,
    fontSize: 15,
    textAlign: 'center',
  },
  submittedIcon: {
    fontSize: 48,
    color: PDQ_GREEN,
  },
  submittedText: {
    fontSize: 20,
    fontWeight: '700',
    color: PDQ_GREEN,
  },
  submittedSub: {
    fontSize: 14,
    color: TEXT_MUTED,
    textAlign: 'center',
  },
  cat3Banner: {
    backgroundColor: '#ef44441a',
    borderBottomWidth: 2,
    borderBottomColor: PDQ_RED,
    padding: 12,
  },
  cat3BannerText: {
    color: PDQ_RED,
    fontWeight: '700',
    fontSize: 13,
    textAlign: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  banner: {
    backgroundColor: BG_CARD,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: PDQ_ORANGE,
  },
  bannerTitle: {
    fontWeight: '700',
    fontSize: 17,
    color: TEXT_PRIMARY,
  },
  bannerAddress: {
    fontSize: 13,
    color: TEXT_MUTED,
  },
  card: {
    backgroundColor: BG_CARD,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statsTitle: {
    fontWeight: '700',
    fontSize: 15,
    color: TEXT_PRIMARY,
  },
  submittedBadge: {
    backgroundColor: '#22c55e1a',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  submittedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: PDQ_GREEN,
  },
  input: {
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: TEXT_SECONDARY,
    marginBottom: 10,
    backgroundColor: BG_INPUT,
  },
  inputError: {
    borderColor: PDQ_RED,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  progressBar: {
    height: 4,
    backgroundColor: BORDER_COLOR,
    borderRadius: 2,
    marginTop: 10,
    marginBottom: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: PDQ_GREEN,
    borderRadius: 2,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    backgroundColor: BG_INPUT,
  },
  chipActive: {
    backgroundColor: PDQ_ORANGE,
    borderColor: PDQ_ORANGE,
  },
  chipText: {
    fontSize: 13,
    color: TEXT_SECONDARY,
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#fff',
  },
  addRoomBtn: {
    backgroundColor: 'transparent',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: BORDER_COLOR,
    borderStyle: 'dashed',
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  addRoomText: {
    color: TEXT_MUTED,
    fontWeight: '600',
    fontSize: 15,
  },
  submitBtn: {
    backgroundColor: PDQ_GREEN,
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  // Room Picker
  pickerContainer: {
    flex: 1,
    backgroundColor: BG_APP,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
    backgroundColor: BG_CARD,
  },
  pickerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  pickerClose: {
    color: PDQ_ORANGE,
    fontSize: 15,
    fontWeight: '600',
  },
  presetChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    padding: 14,
  },
  presetChip: {
    backgroundColor: BG_INPUT,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  presetChipText: {
    color: TEXT_SECONDARY,
    fontSize: 13,
  },
  customNameRow: {
    flexDirection: 'row',
    padding: 14,
    gap: 8,
  },
  customInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: TEXT_SECONDARY,
    backgroundColor: BG_INPUT,
  },
  customAddBtn: {
    backgroundColor: PDQ_ORANGE,
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  customAddBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
