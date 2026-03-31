import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useProject } from '../../../hooks/useProject';
import { createSheetWithCarryForward, isWeekend, Sheet } from '../../../lib/storage';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { useAppContext } from '../../../context/AppContext';
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
} from '../../../constants/colors';

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { profile } = useAppContext();
  const { project, sheets, loading, error, refresh } = useProject(id);
  const [creating, setCreating] = useState(false);
  const [addDayVisible, setAddDayVisible] = useState(false);
  const [backdateInput, setBackdateInput] = useState('');

  const todaySheet = sheets.find((s) => s.date === todayISO());

  const createSheetForDate = useCallback(async (date: string) => {
    if (!project) return;
    const existing = sheets.find((s) => s.date === date);
    if (existing) {
      Alert.alert('Sheet exists', `A sheet for ${date} already exists.`);
      return;
    }
    setCreating(true);
    try {
      const sheet = await createSheetWithCarryForward(
        project.id,
        date,
        profile?.full_name ?? null,
        project.water_category,
      );
      await refresh();
      if (profile?.role === 'estimator') {
        router.push(`/(app)/project/estimator/${sheet.id}`);
      } else {
        router.push(`/(app)/project/tech/${sheet.id}`);
      }
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to create sheet');
    } finally {
      setCreating(false);
    }
  }, [project, sheets, profile, router, refresh]);

  const handleCreateSheet = useCallback(async () => {
    await createSheetForDate(todayISO());
  }, [createSheetForDate]);

  const handleAddDay = useCallback(async () => {
    const date = backdateInput.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      Alert.alert('Invalid Date', 'Please enter a date in YYYY-MM-DD format.');
      return;
    }
    if (date >= todayISO()) {
      Alert.alert('Invalid Date', 'Backdate must be before today.');
      return;
    }
    setAddDayVisible(false);
    setBackdateInput('');
    await createSheetForDate(date);
  }, [backdateInput, createSheetForDate]);

  function openSheet(sheet: Sheet) {
    if (profile?.role === 'estimator') {
      router.push(`/(app)/project/estimator/${sheet.id}`);
    } else {
      router.push(`/(app)/project/tech/${sheet.id}`);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={PDQ_ORANGE} />
      </View>
    );
  }

  if (error || !project) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error ?? 'Project not found.'}</Text>
        <Button label="Retry" variant="primary" size="sm" onPress={refresh} />
      </View>
    );
  }

  const isCat3 = project.water_category === 'cat3';

  return (
    <View style={styles.container}>
      {/* Project Banner */}
      <View style={styles.banner}>
        <Text style={styles.jobName}>{project.job_name}</Text>
        {project.address ? (
          <Text style={styles.address}>{project.address}</Text>
        ) : null}
        <View style={styles.badgeRow}>
          <Badge variant={project.status === 'complete' ? 'complete' : 'active'} />
          {project.water_category && (
            <Badge variant={isCat3 ? 'cat3' : 'cat2'} />
          )}
          <Text style={styles.meta}>{project.job_type}</Text>
        </View>
      </View>

      {/* Create Today's Sheet */}
      {!todaySheet && (
        <View style={styles.createRow}>
          <Button
            label={isWeekend(todayISO()) ? "Create Today's Sheet (Weekend)" : "Create Today's Sheet"}
            variant="primary"
            size="lg"
            loading={creating}
            onPress={handleCreateSheet}
          />
        </View>
      )}

      {/* Add Day (backdate) */}
      <View style={styles.addDayRow}>
        <TouchableOpacity
          style={styles.addDayBtn}
          onPress={() => setAddDayVisible(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.addDayText}>+ Add Day (backdate missed sheet)</Text>
        </TouchableOpacity>
      </View>

      {/* Sheets List */}
      <Text style={styles.sectionTitle}>Daily Sheets</Text>
      <FlatList
        data={sheets}
        keyExtractor={(s) => s.id}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={refresh} tintColor={PDQ_ORANGE} />
        }
        contentContainerStyle={sheets.length === 0 ? styles.emptyContainer : styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No sheets yet. Create today's sheet above.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const isToday = item.date === todayISO();
          return (
            <TouchableOpacity
              style={[styles.sheetCard, isToday && styles.sheetCardToday]}
              onPress={() => openSheet(item)}
              activeOpacity={0.8}
            >
              <View style={styles.sheetLeft}>
                <Text style={styles.sheetDate}>
                  {isToday ? 'Today' : formatDate(item.date)}
                </Text>
                <Text style={styles.sheetTech}>{item.tech_name ?? 'No tech name'}</Text>
              </View>
              <View style={styles.sheetRight}>
                {item.weekend_sheet && (
                  <View style={styles.weekendBadge}>
                    <Text style={styles.weekendBadgeText}>WKD</Text>
                  </View>
                )}
                {item.submitted && (
                  <View style={styles.submittedBadge}>
                    <Text style={styles.submittedText}>Submitted</Text>
                  </View>
                )}
                <Badge variant={item.hours_type === 'after' ? 'after' : 'regular'} />
                <Text style={styles.chevron}>{'\u25B8'}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* Add Day Modal */}
      <Modal
        visible={addDayVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setAddDayVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Missed Day</Text>
            <TouchableOpacity onPress={() => setAddDayVisible(false)}>
              <Text style={styles.modalClose}>Cancel</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.modalBody}>
            <Text style={styles.modalLabel}>Enter date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.modalInput}
              value={backdateInput}
              onChangeText={setBackdateInput}
              placeholder="2026-03-28"
              placeholderTextColor={TEXT_DIM}
              keyboardType="default"
              autoFocus
            />
            <Button
              label={creating ? 'Creating...' : 'Create Sheet'}
              variant="primary"
              size="lg"
              loading={creating}
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
  banner: {
    backgroundColor: BG_CARD,
    padding: 14,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: PDQ_ORANGE,
  },
  jobName: {
    fontSize: 17,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  address: {
    fontSize: 13,
    color: TEXT_MUTED,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginTop: 10,
    flexWrap: 'wrap',
  },
  meta: {
    fontSize: 12,
    color: TEXT_DIM,
  },
  createRow: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: TEXT_DIM,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  empty: {
    alignItems: 'center',
  },
  emptyText: {
    color: TEXT_MUTED,
    fontSize: 14,
    textAlign: 'center',
  },
  sheetCard: {
    backgroundColor: BG_CARD,
    borderRadius: 8,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },
  sheetCardToday: {
    borderColor: PDQ_ORANGE,
  },
  sheetLeft: {
    flex: 1,
  },
  sheetDate: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  sheetTech: {
    fontSize: 13,
    color: TEXT_MUTED,
    marginTop: 2,
  },
  sheetRight: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  submittedBadge: {
    backgroundColor: '#22c55e1a',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  submittedText: {
    fontSize: 11,
    fontWeight: '700',
    color: PDQ_GREEN,
  },
  chevron: {
    color: TEXT_DIM,
    fontSize: 16,
  },
  weekendBadge: {
    backgroundColor: '#FF6B001a',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  weekendBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: PDQ_ORANGE,
  },
  addDayRow: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  addDayBtn: {
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderStyle: 'dashed',
  },
  addDayText: {
    color: TEXT_MUTED,
    fontSize: 13,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: BG_APP,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
    backgroundColor: BG_CARD,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  modalClose: {
    color: PDQ_ORANGE,
    fontSize: 15,
    fontWeight: '600',
  },
  modalBody: {
    padding: 16,
    gap: 16,
  },
  modalLabel: {
    fontSize: 14,
    color: TEXT_SECONDARY,
    fontWeight: '500',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: TEXT_PRIMARY,
    backgroundColor: BG_INPUT,
  },
});
