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
  PDQ_BLUE,
  PDQ_DARK,
  PDQ_GRAY,
  PDQ_LIGHT,
  PDQ_RED,
  PDQ_GREEN,
  CAT3_BG,
  CAT3_BORDER,
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

    // Gate check
    const allItems: RoomItem[] = rooms.flatMap((r) =>
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

    const { pending, doneWithoutHours } = countPendingItems(allItems);

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
        <ActivityIndicator size="large" color={PDQ_BLUE} />
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
        <Text style={styles.submittedIcon}>&#10003;</Text>
        <Text style={styles.submittedText}>Sheet Submitted</Text>
        <Text style={styles.submittedSub}>
          This sheet was submitted on{' '}
          {sheet.submitted_at
            ? new Date(sheet.submitted_at).toLocaleDateString()
            : 'N/A'}
        </Text>
        <Button label="Go Back" variant="secondary" size="md" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Cat 3 Warning Banner */}
      {isCat3 && (
        <View style={styles.cat3Banner}>
          <Text style={styles.cat3BannerText}>
            &#9888; CATEGORY 3 — Hydroxyl Generator REQUIRED. Extra PPE mandatory.
          </Text>
        </View>
      )}

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Tech Info */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Technician</Text>
          <TextInput
            style={[styles.input, techNameError && styles.inputError]}
            value={techName}
            onChangeText={(t) => {
              setTechName(t);
              if (t.trim()) setTechNameError(false);
            }}
            placeholder="Enter technician name *"
            placeholderTextColor={PDQ_GRAY}
          />

          <Text style={styles.sectionLabel}>Hours Type</Text>
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
          <Text style={styles.addRoomText}>+ Add Room</Text>
        </TouchableOpacity>

        {/* Submit */}
        <View style={styles.submitRow}>
          <Button
            label="Submit Sheet"
            variant="primary"
            size="lg"
            loading={submitting}
            onPress={handleSubmit}
          />
        </View>
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
            <Text style={styles.pickerTitle}>Add Room</Text>
            <TouchableOpacity onPress={() => setRoomPickerVisible(false)}>
              <Text style={styles.pickerClose}>Cancel</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.customNameRow}>
            <TextInput
              style={styles.customInput}
              value={customRoomName}
              onChangeText={setCustomRoomName}
              placeholder="Custom room name..."
              placeholderTextColor={PDQ_GRAY}
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
          <Text style={styles.pickerSubLabel}>Or choose a preset:</Text>
          <FlatList
            data={ROOM_PRESETS}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.presetRow}
                onPress={() => handleAddRoom(item)}
                disabled={addingRoom}
              >
                <Text style={styles.presetText}>{item}</Text>
                <Text style={styles.presetChevron}>›</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PDQ_LIGHT,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 12,
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
    color: PDQ_GRAY,
    textAlign: 'center',
  },
  cat3Banner: {
    backgroundColor: CAT3_BG,
    borderBottomWidth: 2,
    borderBottomColor: CAT3_BORDER,
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
    padding: 12,
    paddingBottom: 40,
  },
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
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: PDQ_GRAY,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: PDQ_DARK,
    marginBottom: 12,
    backgroundColor: '#fafafa',
  },
  inputError: {
    borderColor: PDQ_RED,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#f3f4f6',
  },
  chipActive: {
    backgroundColor: PDQ_BLUE,
    borderColor: PDQ_BLUE,
  },
  chipText: {
    fontSize: 13,
    color: PDQ_DARK,
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#fff',
  },
  addRoomBtn: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: PDQ_BLUE,
    borderStyle: 'dashed',
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  addRoomText: {
    color: PDQ_BLUE,
    fontWeight: '700',
    fontSize: 15,
  },
  submitRow: {
    marginTop: 8,
  },
  // Room Picker
  pickerContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  pickerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: PDQ_DARK,
  },
  pickerClose: {
    color: PDQ_BLUE,
    fontSize: 15,
  },
  customNameRow: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  customInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: PDQ_DARK,
  },
  customAddBtn: {
    backgroundColor: PDQ_BLUE,
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
  pickerSubLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: PDQ_GRAY,
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  presetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  presetText: {
    fontSize: 15,
    color: PDQ_DARK,
  },
  presetChevron: {
    fontSize: 18,
    color: PDQ_GRAY,
  },
});
