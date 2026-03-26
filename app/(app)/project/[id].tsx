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
  PDQ_BLUE,
  PDQ_DARK,
  PDQ_GRAY,
  PDQ_GREEN,
  PDQ_LIGHT,
  PDQ_RED,
} from '../../../constants/colors';

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
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
        <ActivityIndicator size="large" color={PDQ_BLUE} />
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
      {/* Project Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerTitles}>
            <Text style={styles.jobName}>{project.job_name}</Text>
            <Text style={styles.address}>{project.address}</Text>
          </View>
          <View style={styles.badges}>
            <Badge variant={project.status === 'complete' ? 'complete' : 'active'} />
            {project.water_category && (
              <Badge variant={isCat3 ? 'cat3' : 'cat2'} />
            )}
          </View>
        </View>
        <Text style={styles.meta}>
          {project.job_type} &bull; Created {formatDate(project.created_at)}
        </Text>
      </View>

      {/* Create Today's Sheet */}
      <View style={styles.createRow}>
        <Button
          label={todaySheet ? "Today's Sheet Created" : "Create Today's Sheet"}
          variant={todaySheet ? 'secondary' : 'primary'}
          size="md"
          loading={creating}
          disabled={!!todaySheet}
          onPress={handleCreateSheet}
        />
      </View>

      {/* Sheets List */}
      <Text style={styles.sectionTitle}>Daily Sheets</Text>
      <FlatList
        data={sheets}
        keyExtractor={(s) => s.id}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={refresh} tintColor={PDQ_BLUE} />
        }
        contentContainerStyle={sheets.length === 0 ? styles.emptyContainer : styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No sheets yet. Create today's sheet above.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.sheetCard}
            onPress={() => openSheet(item)}
            activeOpacity={0.8}
          >
            <View style={styles.sheetLeft}>
              <Text style={styles.sheetDate}>{formatDate(item.date)}</Text>
              <Text style={styles.sheetTech}>{item.tech_name ?? 'No tech name'}</Text>
            </View>
            <View style={styles.sheetRight}>
              <Badge variant={item.submitted ? 'submitted' : 'active'} />
              <Badge variant={item.hours_type === 'after' ? 'after' : 'regular'} />
            </View>
          </TouchableOpacity>
        )}
      />
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
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  headerTitles: {
    flex: 1,
    marginRight: 12,
  },
  jobName: {
    fontSize: 18,
    fontWeight: '700',
    color: PDQ_DARK,
  },
  address: {
    fontSize: 13,
    color: PDQ_GRAY,
    marginTop: 2,
  },
  badges: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  meta: {
    fontSize: 12,
    color: PDQ_GRAY,
    marginTop: 4,
  },
  createRow: {
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: PDQ_GRAY,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  list: {
    paddingHorizontal: 12,
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
    color: PDQ_GRAY,
    fontSize: 14,
    textAlign: 'center',
  },
  sheetCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  sheetLeft: {
    flex: 1,
  },
  sheetDate: {
    fontSize: 15,
    fontWeight: '600',
    color: PDQ_DARK,
  },
  sheetTech: {
    fontSize: 13,
    color: PDQ_GRAY,
    marginTop: 2,
  },
  sheetRight: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
});
