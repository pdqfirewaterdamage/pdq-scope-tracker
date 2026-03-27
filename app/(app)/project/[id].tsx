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
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useProject } from '../../../hooks/useProject';
import { createSheet, Sheet } from '../../../lib/storage';
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

  const todaySheet = sheets.find((s) => s.date === todayISO());

  const handleCreateSheet = useCallback(async () => {
    if (!project) return;
    if (todaySheet) {
      Alert.alert('Sheet exists', 'A sheet for today already exists.');
      return;
    }
    setCreating(true);
    try {
      const sheet = await createSheet({
        project_id: project.id,
        tech_name: profile?.full_name ?? null,
        hours_type: 'regular',
        contents_status: null,
        contents_boxes: null,
        contents_hours: null,
        date: todayISO(),
      });
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
  }, [project, todaySheet, profile, router]);

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
            label="Create Today's Sheet"
            variant="primary"
            size="lg"
            loading={creating}
            onPress={handleCreateSheet}
          />
        </View>
      )}

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
});
