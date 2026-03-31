import React, { useState, useCallback, useEffect, useRef } from 'react';
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
import { getProject, getSheets, createRoom, createItems, updateSheet, deleteRoom, createSheetWithCarryForward, Project, Sheet as SheetType } from '../../../../lib/storage';
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
  PDQ_AMBER,
  PDQ_GRAY,
  PDQ_BLUE,
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

  // All sheets for date pills
  const [allSheets, setAllSheets] = useState<SheetType[]>([]);

  // Backdate modal state
  const [addDayVisible, setAddDayVisible] = useState(false);
  const [backdateInput, setBackdateInput] = useState('');
  const [creatingDay, setCreatingDay] = useState(false);

  // Room picker state
  const [roomPickerVisible, setRoomPickerVisible] = useState(false);
  const [customRoomName, setCustomRoomName] = useState('');
  const [addingRoom, setAddingRoom] = useState(false);

  // Additional techs state
  const [additionalTechsAnswered, setAdditionalTechsAnswered] = useState(false);
  const [additionalTechsYes, setAdditionalTechsYes] = useState(false);
  const [additionalTechsText, setAdditionalTechsText] = useState('');

  // General — Daily section state
  const [generalCollapsed, setGeneralCollapsed] = useState(false);
  const [dailyNotes, setDailyNotes] = useState('');

  // Scroll-to-pending refs
  const scrollViewRef = useRef<ScrollView>(null);
  const roomYPositions = useRef<Record<string, number>>({});
  const generalYPosition = useRef<number>(0);

  // Stats
  const allItems = rooms.flatMap((r) => r.items as Item[]);
  const doneCount = allItems.filter((i) => i.status === 'done').length;
  const naCount = allItems.filter((i) => i.status === 'not_needed').length;
  const pendingCount = allItems.filter((i) => i.status === 'pending').length;
  const totalCount = allItems.length;
  const progressPct = totalCount > 0 ? ((doneCount + naCount) / totalCount) * 100 : 0;

  // General — Daily items (from rooms with phase === 'general' in the General / Daily subsection)
  const generalItems: Item[] = allItems.filter(
    (i) => i.phase === 'general' && i.subsection === 'General / Daily'
  );
  const generalPendingCount = generalItems.filter((i) => i.status === 'pending').length;
  const generalAllDone = generalItems.length > 0 && generalPendingCount === 0;

  // Featured general daily items for the dedicated card
  const GENERAL_DAILY_FEATURED = ['gen_ppe', 'gen_moisture_am', 'gen_eod_check'];
  const featuredGeneralItems = generalItems.filter((i) =>
    GENERAL_DAILY_FEATURED.includes(i.scope_item_id) ||
    i.scope_item_id === 'gen_ppe' ||
    i.label.toLowerCase().includes('moisture') ||
    i.label.toLowerCase().includes('clean up')
  );
  // Use all general items if we don't have specific featured ones
  const displayGeneralItems = featuredGeneralItems.length > 0 ? generalItems : [];

  // Submit button logic
  const hasRooms = rooms.length > 0;
  const nonGeneralRooms = rooms.filter((r) =>
    (r.items as Item[]).some((i) => i.phase !== 'general')
  );
  const canSubmit = additionalTechsAnswered && (
    (hasRooms && pendingCount === 0) ||
    (!hasRooms && generalAllDone) ||
    (generalAllDone && nonGeneralRooms.length === 0)
  );
  const getSubmitText = () => {
    if (hasRooms && allItems.length > 0) return "Submit Today's Scope Sheet";
    if (!hasRooms && generalAllDone) return 'Submit (General Only)';
    return "Submit Today's Scope Sheet";
  };
  const getSubmitHint = () => {
    if (!additionalTechsAnswered) return 'Answer "Additional Techs on Site?" to unlock';
    if (!hasRooms && !generalAllDone) return 'Complete General \u2014 Daily or add a room to unlock';
    return null;
  };

  useEffect(() => {
    if (sheet?.project_id) {
      getProject(sheet.project_id).then(setProject).catch(() => null);
      if (sheet.tech_name) setTechName(sheet.tech_name);
      if (sheet.hours_type) setHoursType(sheet.hours_type);
      if (sheet.additional_techs_answered) {
        setAdditionalTechsAnswered(true);
        if (sheet.additional_techs && sheet.additional_techs.length > 0) {
          setAdditionalTechsYes(true);
          setAdditionalTechsText(sheet.additional_techs.join(', '));
        } else {
          setAdditionalTechsYes(false);
        }
      }
    }
  }, [sheet?.project_id, sheet?.tech_name, sheet?.hours_type, sheet?.additional_techs_answered]);

  // Load all sheets for date pill tabs
  useEffect(() => {
    if (sheet?.project_id) {
      getSheets(sheet.project_id)
        .then((sheets) => {
          // Sort by date ascending
          const sorted = [...sheets].sort((a, b) => a.date.localeCompare(b.date));
          setAllSheets(sorted);
        })
        .catch(() => null);
    }
  }, [sheet?.project_id]);

  const todayISO = new Date().toISOString().slice(0, 10);

  const formatPillDate = (dateStr: string): string => {
    if (dateStr === todayISO) return 'Today';
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const handleAddDay = useCallback(async () => {
    if (!sheet || !project) return;
    const date = backdateInput.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      Alert.alert('Invalid Date', 'Please enter a date in YYYY-MM-DD format.');
      return;
    }
    const existing = allSheets.find((s) => s.date === date);
    if (existing) {
      Alert.alert('Sheet exists', `A sheet for ${date} already exists.`);
      return;
    }
    setCreatingDay(true);
    try {
      const newSheet = await createSheetWithCarryForward(
        project.id,
        date,
        techName || null,
        project.water_category,
      );
      setAddDayVisible(false);
      setBackdateInput('');
      router.replace('/(app)/project/tech/' + newSheet.id);
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to create sheet');
    } finally {
      setCreatingDay(false);
    }
  }, [sheet, project, backdateInput, allSheets, techName, router]);

  const isCat3 = project?.water_category === 'cat3';

  // Auto-save tech name on blur
  const saveTechName = useCallback(async () => {
    if (!sheet || !techName.trim()) return;
    try {
      await updateSheet(sheet.id, { tech_name: techName.trim() });
    } catch (e) {
      console.error('Failed to save tech name', e);
    }
  }, [sheet, techName]);

  // Auto-save hours type on change
  const saveHoursType = useCallback(async (ht: 'regular' | 'after') => {
    setHoursType(ht);
    if (!sheet) return;
    try {
      await updateSheet(sheet.id, { hours_type: ht });
    } catch (e) {
      console.error('Failed to save hours type', e);
    }
  }, [sheet]);

  // Save additional techs answer
  const saveAdditionalTechs = useCallback(async (answered: boolean, yes: boolean, text: string) => {
    if (!sheet) return;
    const techs = yes ? text.split(',').map((t) => t.trim()).filter(Boolean) : null;
    try {
      await updateSheet(sheet.id, {
        additional_techs_answered: answered,
        additional_techs: techs,
      });
    } catch (e) {
      console.error('Failed to save additional techs', e);
    }
  }, [sheet]);

  const handleAdditionalTechsYes = useCallback(() => {
    setAdditionalTechsAnswered(true);
    setAdditionalTechsYes(true);
    saveAdditionalTechs(true, true, additionalTechsText);
  }, [saveAdditionalTechs, additionalTechsText]);

  const handleAdditionalTechsNo = useCallback(() => {
    setAdditionalTechsAnswered(true);
    setAdditionalTechsYes(false);
    setAdditionalTechsText('');
    saveAdditionalTechs(true, false, '');
  }, [saveAdditionalTechs]);

  const handleAdditionalTechsTextBlur = useCallback(() => {
    if (additionalTechsAnswered && additionalTechsYes) {
      saveAdditionalTechs(true, true, additionalTechsText);
    }
  }, [additionalTechsAnswered, additionalTechsYes, additionalTechsText, saveAdditionalTechs]);

  // Toggle general item status
  const handleGeneralItemToggle = useCallback(async (item: Item) => {
    const nextStatus = item.status === 'pending' ? 'done'
      : item.status === 'done' ? 'not_needed'
      : 'pending';
    await updateItem(item.id, { status: nextStatus });
  }, [updateItem]);

  // Scroll to first room (or general section) with pending items
  const handleScrollToPending = useCallback(() => {
    // Check rooms for pending items
    for (const room of rooms) {
      const roomItems = room.items as Item[];
      const hasPending = roomItems.some((i) => i.status === 'pending');
      if (hasPending && roomYPositions.current[room.id] !== undefined) {
        scrollViewRef.current?.scrollTo({
          y: roomYPositions.current[room.id],
          animated: true,
        });
        return;
      }
    }
    // If no room pending, check general section
    if (generalItems.some((i) => i.status === 'pending')) {
      setGeneralCollapsed(false);
      scrollViewRef.current?.scrollTo({
        y: generalYPosition.current,
        animated: true,
      });
    }
  }, [rooms, generalItems]);

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
          measurements: null,
        });

        const waterCat = project.water_category === 'cat3' ? 'cat3' : 'cat2';
        const templateItems: RoomItem[] = makeRoomItems(waterCat);
        const isWeekendSheet = sheet.weekend_sheet;
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
          require_photo: ti.requirePhoto ?? false,
          sort_order: ti.sortOrder,
          status: 'pending' as const,
          hours: null,
          hours_type: isWeekendSheet ? 'after' as const : 'regular' as const,
          note: null,
          qty_value: null,
          drop_value: null,
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

    if (!additionalTechsAnswered) {
      Alert.alert('Required', 'Please answer "Additional Techs on Site?" before submitting.');
      return;
    }

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

    // General-only submit: if no rooms exist, allow submit as long as
    // general items (from contents section) are answered
    const hasRooms = rooms.length > 0;

    if (pending > 0 && hasRooms) {
      // Build a list of pending items grouped by room
      const pendingByRoom: string[] = [];
      for (const room of rooms) {
        const pendingItems = (room.items as Item[]).filter((i) => i.status === 'pending');
        if (pendingItems.length > 0) {
          const itemNames = pendingItems.slice(0, 5).map((i) => `  \u25CB ${i.label}`).join('\n');
          const more = pendingItems.length > 5 ? `\n  ...and ${pendingItems.length - 5} more` : '';
          pendingByRoom.push(`${room.name} (${pendingItems.length}):\n${itemNames}${more}`);
        }
      }
      Alert.alert(
        `${pending} Pending Item${pending > 1 ? 's' : ''}`,
        `Mark all items as Done (\u2713) or N/A (\u2014) before submitting.\n\n${pendingByRoom.join('\n\n')}`,
        [{ text: 'OK' }]
      );
      return;
    }

    // Hours are optional — don't block submission for missing hours

    setSubmitting(true);
    try {
      await submitSheet(techName.trim());
      // Navigate to estimator view to show the PDF preview
      router.replace(`/(app)/project/estimator/${id}`);
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to submit sheet');
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
    // Redirect to estimator view for submitted sheets
    router.replace(`/(app)/project/estimator/${id}`);
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={PDQ_ORANGE} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Date Pill Tabs */}
      {allSheets.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.datePillRow}
          contentContainerStyle={styles.datePillContent}
        >
          {allSheets.map((sh) => {
            const isActive = sh.id === id;
            return (
              <TouchableOpacity
                key={sh.id}
                style={[styles.datePill, isActive ? styles.datePillActive : styles.datePillInactive]}
                onPress={() => {
                  if (!isActive) router.replace('/(app)/project/tech/' + sh.id);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.datePillText, isActive && styles.datePillTextActive]}>
                  {formatPillDate(sh.date)}{sh.submitted ? ' \u2713' : ''}
                </Text>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity
            style={[styles.datePill, styles.datePillAdd]}
            onPress={() => setAddDayVisible(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.datePillAddText}>+ Add Day</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Weekend Banner */}
      {sheet.weekend_sheet && (
        <View style={styles.weekendBanner}>
          <Text style={styles.weekendBannerText}>
            {'\uD83D\uDFE0'} WEEKEND SHEET — All hours default to After Hours
          </Text>
        </View>
      )}

      {/* Cat 3 Warning Banner */}
      {isCat3 && (
        <View style={styles.cat3Banner}>
          <Text style={styles.cat3BannerText}>
            {'\u26A0'} CATEGORY 3 — Hydroxyl Generator REQUIRED. Extra PPE mandatory.
          </Text>
        </View>
      )}

      <ScrollView ref={scrollViewRef} style={styles.scroll} contentContainerStyle={styles.scrollContent}>
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
            onBlur={saveTechName}
            placeholder="Tech name"
            placeholderTextColor={TEXT_DIM}
          />

          {/* Additional Techs on Site */}
          <View style={styles.additionalTechsRow}>
            <View style={styles.additionalTechsLabel}>
              <Text style={styles.additionalTechsLabelText}>Additional Techs on Site?</Text>
              {!additionalTechsAnswered && (
                <View style={styles.mustAnswerBadge}>
                  <Text style={styles.mustAnswerText}>{'\u26A0'} MUST ANSWER</Text>
                </View>
              )}
            </View>
            <View style={styles.additionalTechsBtns}>
              <TouchableOpacity
                style={[
                  styles.additionalTechBtn,
                  additionalTechsAnswered && additionalTechsYes && styles.additionalTechBtnActive,
                ]}
                onPress={handleAdditionalTechsYes}
              >
                <Text style={[
                  styles.additionalTechBtnText,
                  additionalTechsAnswered && additionalTechsYes && styles.additionalTechBtnTextActive,
                ]}>Yes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.additionalTechBtn,
                  additionalTechsAnswered && !additionalTechsYes && styles.additionalTechBtnActive,
                ]}
                onPress={handleAdditionalTechsNo}
              >
                <Text style={[
                  styles.additionalTechBtnText,
                  additionalTechsAnswered && !additionalTechsYes && styles.additionalTechBtnTextActive,
                ]}>No</Text>
              </TouchableOpacity>
            </View>
            {additionalTechsAnswered && additionalTechsYes && (
              <TextInput
                style={[styles.input, { marginTop: 8, marginBottom: 0 }]}
                value={additionalTechsText}
                onChangeText={setAdditionalTechsText}
                onBlur={handleAdditionalTechsTextBlur}
                placeholder="Additional tech names (comma separated)"
                placeholderTextColor={TEXT_DIM}
              />
            )}
            {additionalTechsAnswered && !additionalTechsYes && (
              <Text style={styles.onlyLeadText}>{'\u2713'} Only lead tech on site today</Text>
            )}
          </View>

          <View style={styles.statsRow}>
            <Text style={{ color: PDQ_GREEN, fontWeight: '600', fontSize: 13 }}>
              {'\u2713'} {doneCount}
            </Text>
            <Text style={{ color: '#f59e0b', fontWeight: '600', fontSize: 13 }}>
              — {naCount} N/A
            </Text>
            <TouchableOpacity onPress={handleScrollToPending} activeOpacity={0.7}>
              <Text style={{ color: pendingCount > 0 ? PDQ_AMBER : TEXT_MUTED, fontWeight: '600', fontSize: 13 }}>
                {'\u25CB'} {pendingCount} left {pendingCount > 0 ? '\u25BE' : ''}
              </Text>
            </TouchableOpacity>
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
                onPress={() => saveHoursType(ht)}
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

        {/* General — Daily Section */}
        {generalItems.length > 0 && (
          <View
            style={styles.generalCard}
            onLayout={(e) => {
              generalYPosition.current = e.nativeEvent.layout.y;
            }}
          >
            <TouchableOpacity
              style={styles.generalHeader}
              onPress={() => setGeneralCollapsed(!generalCollapsed)}
              activeOpacity={0.8}
            >
              <Text style={styles.generalHeaderText}>General {'\u2014'} Daily</Text>
              <View style={styles.generalBadgeRow}>
                {generalPendingCount > 0 && (
                  <View style={styles.generalPendingBadge}>
                    <Text style={styles.generalPendingText}>
                      {'\u25CB'} {generalPendingCount} left
                    </Text>
                  </View>
                )}
                {generalAllDone && (
                  <View style={styles.generalDoneBadge}>
                    <Text style={styles.generalDoneText}>{'\u2713'} Done</Text>
                  </View>
                )}
                <Text style={styles.collapseArrow}>{generalCollapsed ? '\u25B8' : '\u25BE'}</Text>
              </View>
            </TouchableOpacity>

            {!generalCollapsed && (
              <View style={styles.generalBody}>
                {generalItems.map((item) => (
                  <View key={item.id} style={styles.generalItemRow}>
                    <TouchableOpacity
                      style={[
                        styles.generalStatusBtn,
                        item.status === 'done' && styles.generalStatusDone,
                        item.status === 'not_needed' && styles.generalStatusNa,
                      ]}
                      onPress={() => handleGeneralItemToggle(item)}
                    >
                      <Text style={styles.generalStatusText}>
                        {item.status === 'pending' ? '\u25CB' : item.status === 'done' ? '\u2713' : '\u2014'}
                      </Text>
                    </TouchableOpacity>
                    <View style={styles.generalItemInfo}>
                      <Text style={[
                        styles.generalItemLabel,
                        item.status === 'not_needed' && styles.generalItemStrikethrough,
                      ]}>
                        {item.label}
                      </Text>
                      <View style={styles.generalItemBadges}>
                        {item.no_hours && (
                          <Text style={styles.noHoursLabel}>no hrs</Text>
                        )}
                        {item.require_photo && (
                          <Text style={styles.photoBadge}>{'\uD83D\uDCF7'}</Text>
                        )}
                        {item.input_type === 'qty' && (
                          <TextInput
                            style={styles.generalQtyInput}
                            value={item.qty_value ?? ''}
                            onChangeText={(v) => updateItem(item.id, { qty_value: v })}
                            placeholder="qty"
                            placeholderTextColor={TEXT_DIM}
                            keyboardType="numeric"
                          />
                        )}
                      </View>
                    </View>
                  </View>
                ))}

                {/* Daily Notes */}
                <TextInput
                  style={[styles.input, { marginTop: 12 }]}
                  value={dailyNotes}
                  onChangeText={setDailyNotes}
                  placeholder="Daily Notes..."
                  placeholderTextColor={TEXT_DIM}
                  multiline
                  numberOfLines={3}
                />
              </View>
            )}
          </View>
        )}

        {/* Rooms */}
        {rooms.map((room) => (
          <View
            key={room.id}
            onLayout={(e) => {
              roomYPositions.current[room.id] = e.nativeEvent.layout.y;
            }}
          >
          <RoomSection
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
          </View>
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
        {getSubmitHint() && (
          <Text style={styles.submitHint}>{getSubmitHint()}</Text>
        )}
        <TouchableOpacity
          style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.8}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>{getSubmitText()}</Text>
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

      {/* Add Day (Backdate) Modal */}
      <Modal
        visible={addDayVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setAddDayVisible(false)}
      >
        <View style={styles.pickerContainer}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>Add Missed Day</Text>
            <TouchableOpacity onPress={() => setAddDayVisible(false)}>
              <Text style={styles.pickerClose}>Cancel</Text>
            </TouchableOpacity>
          </View>
          <View style={{ padding: 16, gap: 12 }}>
            <Text style={{ color: TEXT_SECONDARY, fontSize: 14, marginBottom: 4 }}>
              Enter date (YYYY-MM-DD)
            </Text>
            <TextInput
              style={styles.input}
              value={backdateInput}
              onChangeText={setBackdateInput}
              placeholder="2026-03-28"
              placeholderTextColor={TEXT_DIM}
              keyboardType="default"
              autoFocus
            />
            <Button
              label={creatingDay ? 'Creating...' : 'Create Sheet'}
              variant="primary"
              size="lg"
              loading={creatingDay}
              onPress={handleAddDay}
            />
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
  datePillRow: {
    flexGrow: 0,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
    backgroundColor: BG_CARD,
  },
  datePillContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  datePill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  datePillActive: {
    backgroundColor: PDQ_BLUE,
  },
  datePillInactive: {
    backgroundColor: BG_INPUT,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },
  datePillText: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_SECONDARY,
  },
  datePillTextActive: {
    color: '#fff',
  },
  datePillAdd: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderStyle: 'dashed',
  },
  datePillAddText: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_MUTED,
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
  weekendBanner: {
    backgroundColor: '#FF6B001a',
    borderBottomWidth: 2,
    borderBottomColor: PDQ_ORANGE,
    padding: 12,
  },
  weekendBannerText: {
    color: PDQ_ORANGE,
    fontWeight: '700',
    fontSize: 13,
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
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  submitHint: {
    color: PDQ_AMBER,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 4,
    fontWeight: '600',
  },
  // Additional Techs
  additionalTechsRow: {
    marginBottom: 10,
  },
  additionalTechsLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  additionalTechsLabelText: {
    color: TEXT_PRIMARY,
    fontWeight: '600',
    fontSize: 14,
  },
  mustAnswerBadge: {
    backgroundColor: '#f59e0b1a',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  mustAnswerText: {
    fontSize: 11,
    fontWeight: '700',
    color: PDQ_AMBER,
  },
  additionalTechsBtns: {
    flexDirection: 'row',
    gap: 8,
  },
  additionalTechBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    backgroundColor: BG_INPUT,
  },
  additionalTechBtnActive: {
    backgroundColor: PDQ_ORANGE,
    borderColor: PDQ_ORANGE,
  },
  additionalTechBtnText: {
    color: TEXT_SECONDARY,
    fontWeight: '600',
    fontSize: 14,
  },
  additionalTechBtnTextActive: {
    color: '#fff',
  },
  onlyLeadText: {
    color: PDQ_GREEN,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
  },
  // General — Daily
  generalCard: {
    backgroundColor: BG_CARD,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    overflow: 'hidden',
  },
  generalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
  },
  generalHeaderText: {
    fontWeight: '700',
    fontSize: 15,
    color: TEXT_PRIMARY,
  },
  generalBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  generalPendingBadge: {
    backgroundColor: '#f59e0b1a',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  generalPendingText: {
    fontSize: 11,
    fontWeight: '700',
    color: PDQ_AMBER,
  },
  generalDoneBadge: {
    backgroundColor: '#22c55e1a',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  generalDoneText: {
    fontSize: 11,
    fontWeight: '700',
    color: PDQ_GREEN,
  },
  collapseArrow: {
    color: TEXT_MUTED,
    fontSize: 14,
  },
  generalBody: {
    padding: 14,
  },
  generalItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
  },
  generalStatusBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BG_INPUT,
  },
  generalStatusDone: {
    backgroundColor: PDQ_GREEN,
    borderColor: PDQ_GREEN,
  },
  generalStatusNa: {
    backgroundColor: '#f59e0b33',
    borderColor: PDQ_AMBER,
  },
  generalStatusText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  generalItemInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  generalItemLabel: {
    color: TEXT_SECONDARY,
    fontSize: 14,
    flex: 1,
  },
  generalItemStrikethrough: {
    textDecorationLine: 'line-through',
    color: TEXT_DIM,
  },
  generalItemBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  noHoursLabel: {
    fontSize: 10,
    color: TEXT_DIM,
    fontStyle: 'italic',
  },
  photoBadge: {
    fontSize: 14,
  },
  generalQtyInput: {
    width: 50,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 13,
    color: TEXT_SECONDARY,
    backgroundColor: BG_INPUT,
    textAlign: 'center',
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
